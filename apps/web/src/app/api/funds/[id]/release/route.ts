import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"

type Params = { params: { id: string } }

export async function POST(request: Request, { params }: Params) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json(
        { data: null, error: "Fund ID không hợp lệ" },
        { status: 400 }
      )
    }

    // D6: buffer release = simple UPDATE released_at
    const { data, error } = await auth.supabase
      .from("funds")
      .update({ released_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("household_id", auth.householdId)
      .eq("fund_type", "freedom")
      .select("released_at")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { data: null, error: "Quỹ không tồn tại hoặc không phải quỹ đệm tháng" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { released_at: data.released_at }, error: null })
  })
}
