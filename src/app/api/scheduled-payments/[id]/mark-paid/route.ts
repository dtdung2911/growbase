import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { markPaidFormSchema } from "@/lib/validations/scheduled-payment"

type RouteParams = { params: { id: string } }

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = markPaidFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const input = parsed.data
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await auth.supabase.rpc("mark_payment_paid", {
    p_payment_id: params.id,
    p_household_id: auth.householdId,
    p_create_transaction: input.create_transaction,
    p_account_id: input.account_id ?? "",
    p_category_id: input.category_id ?? "",
    p_member_id: input.member_id ?? auth.memberId,
    p_date: input.date ?? today,
  })

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: {
      payment_id: params.id,
      tx_id: input.create_transaction ? data : null,
    },
    error: null,
  })
}
