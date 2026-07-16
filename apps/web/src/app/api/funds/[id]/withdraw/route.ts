import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { fundWithdrawSchema } from "@growbase/shared/schemas/fund"

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

    const body = await request.json().catch(() => null)
    const parsed = fundWithdrawSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const input = parsed.data

    // R8: Fund balance never negative — check before RPC
    const { data: fund } = await auth.supabase
      .from("funds")
      .select("current_balance")
      .eq("id", params.id)
      .eq("household_id", auth.householdId)
      .single()

    if (!fund) {
      return NextResponse.json(
        { data: null, error: "Quỹ không tồn tại" },
        { status: 404 }
      )
    }

    if (input.amount > fund.current_balance) {
      return NextResponse.json(
        { data: null, error: "Số tiền rút vượt quá số dư quỹ" },
        { status: 400 }
      )
    }

    // R1: Fund ops = RPC only
    const { data, error } = await auth.supabase.rpc("fund_withdraw", {
      p_household_id: auth.householdId,
      p_fund_id: params.id,
      p_member_id: auth.memberId,
      p_amount: input.amount,
      p_account_id: input.account_id,
      p_category_id: input.category_id,
      p_description: input.description ?? "",
      p_date: input.transaction_date,
    })

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { data: { tx_id: data as string }, error: null },
      { status: 201 }
    )
  })
}
