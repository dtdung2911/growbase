import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { createTransferSchema } from "@growbase/shared/schemas/transaction"

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = createTransferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Lookup system category for internal_transfer
    const { data: transferCategory } = await auth.supabase
      .from("categories")
      .select("id")
      .eq("is_system", true)
      .eq("name", "Chuyển khoản nội bộ")
      .limit(1)
      .maybeSingle()

    if (!transferCategory) {
      return NextResponse.json(
        { data: null, error: "Không tìm thấy danh mục chuyển khoản nội bộ" },
        { status: 500 }
      )
    }

    // D5: CC payment auto-label
    let description = input.description ?? null
    if (input.is_credit_card_payment) {
      const { data: toAccount } = await auth.supabase
        .from("accounts")
        .select("name")
        .eq("id", input.to_account_id)
        .single()
      const label = `Thanh toán thẻ tín dụng ${toAccount?.name ?? ""}`
      description = description ? `${label} - ${description}` : label
    }

    // D1: 2 INSERTs — OUT from source, IN to destination
    const shared = {
      household_id: auth.householdId,
      member_id: auth.memberId,
      amount: input.amount,
      transaction_type: "internal_transfer" as const,
      category_id: transferCategory.id,
      transaction_date: input.transaction_date,
      is_unusual_income: false,
    }

    const { data: outTx, error: outErr } = await auth.supabase
      .from("transactions")
      .insert({
        ...shared,
        direction: "out" as const,
        account_id: input.from_account_id,
        description,
      })
      .select("id")
      .single()

    if (outErr) {
      return NextResponse.json({ data: null, error: outErr.message }, { status: 500 })
    }

    const { data: inTx, error: inErr } = await auth.supabase
      .from("transactions")
      .insert({
        ...shared,
        direction: "in" as const,
        account_id: input.to_account_id,
        description,
      })
      .select("id")
      .single()

    if (inErr) {
      // Partial fail — cleanup out tx (true atomicity deferred to S3 DB function)
      const { error: cleanupErr } = await auth.supabase
        .from("transactions")
        .delete()
        .eq("id", outTx.id)
      if (cleanupErr) {
        console.error(
          `[transfer] cleanup failed for outTx ${outTx.id}: ${cleanupErr.message}`
        )
      }
      return NextResponse.json({ data: null, error: inErr.message }, { status: 500 })
    }

    return NextResponse.json(
      { data: { out_id: outTx.id, in_id: inTx.id }, error: null },
      { status: 201 }
    )
  })
}
