import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/supabase/auth-check"
import { fundContributeSchema } from "@growbase/shared/schemas/fund"

type Params = { params: { id: string } }

export async function POST(request: Request, { params }: Params) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  if (!z.string().uuid().safeParse(params.id).success) {
    return NextResponse.json(
      { data: null, error: "Fund ID không hợp lệ" },
      { status: 400 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = fundContributeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const input = parsed.data

  // Fund contributions are recorded against the household's savings_investment category
  const { data: savingsCategory } = await auth.supabase
    .from("categories")
    .select("id")
    .eq("household_id", auth.householdId)
    .eq("default_behavior_type", "savings_investment")
    .order("sort_order")
    .limit(1)
    .maybeSingle()

  if (!savingsCategory) {
    return NextResponse.json(
      { data: null, error: "Không tìm thấy danh mục tiết kiệm cho gia đình" },
      { status: 500 }
    )
  }

  // R1: Fund ops = RPC only
  const { data, error } = await auth.supabase.rpc("fund_contribute", {
    p_household_id: auth.householdId,
    p_fund_id: params.id,
    p_member_id: auth.memberId,
    p_amount: input.amount,
    p_account_id: input.account_id,
    p_category_id: savingsCategory.id,
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
}
