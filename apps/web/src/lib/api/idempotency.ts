import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

const PG_UNIQUE_VIOLATION = "23505"

// Dedupe mutation theo header `Idempotency-Key` (mobile offline queue retry/replay).
// Reserve-before-execute: INSERT placeholder trước khi chạy run() — unique(key,user_id) là lock,
// nên 2 request cùng key KHÔNG BAO GIỜ cùng chạy run() (fix race của bản check-then-act trước).
export async function withIdempotency(
  supabase: SupabaseClient,
  userId: string,
  request: Request,
  run: () => Promise<NextResponse>
): Promise<NextResponse> {
  const key = request.headers.get("idempotency-key")
  if (!key) return run()

  // Reserve: chiếm key bằng placeholder (status/response = null → "đang xử lý").
  const { error: insertError } = await supabase
    .from("idempotency_keys")
    .insert({ key, user_id: userId, status: null, response: null })

  if (insertError) {
    if (insertError.code !== PG_UNIQUE_VIOLATION) return run()

    // Conflict: key đã tồn tại → hoặc đã xong (có response) hoặc đang chạy song song.
    const { data: existing } = await supabase
      .from("idempotency_keys")
      .select("status, response")
      .eq("key", key)
      .eq("user_id", userId)
      .maybeSingle()

    if (existing?.response != null) {
      return NextResponse.json(existing.response, { status: existing.status ?? 200 })
    }

    return NextResponse.json(
      { data: null, error: "Yêu cầu đang được xử lý" },
      { status: 409 }
    )
  }

  // Giữ lock → chạy handler đúng 1 lần. run() throw (bug/timeout trong handler) cũng phải nhả
  // key như lỗi 5xx, không thì placeholder kẹt "đang xử lý" vĩnh viễn → mọi retry sau 409 mãi.
  let response: NextResponse
  try {
    response = await run()
  } catch (err) {
    await supabase.from("idempotency_keys").delete().eq("key", key).eq("user_id", userId)
    throw err
  }

  if (response.status >= 500) {
    // Lỗi transient → nhả key để retry sau được phép chạy lại; không cache 5xx.
    await supabase.from("idempotency_keys").delete().eq("key", key).eq("user_id", userId)
    return response
  }

  // body ?? {} : response null/parse-fail vẫn phải lưu response non-null, không thì cột
  // response=null bị hiểu lầm là "đang xử lý" (giống placeholder) → retry sau nhận 409 mãi
  // dù request gốc đã thành công.
  const body = (await response.clone().json().catch(() => null)) ?? {}
  await supabase
    .from("idempotency_keys")
    .update({ status: response.status, response: body })
    .eq("key", key)
    .eq("user_id", userId)

  return response
}
