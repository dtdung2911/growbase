import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createPurchaseSchema } from "@/lib/validations/investment"

export async function GET(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const holdingId = searchParams.get("holding_id")

  let query = auth.supabase
    .from("investment_purchases")
    .select(
      "id, household_id, holding_id, purchase_month, budget, price, fees, quantity, amount, end_value, monthly_return, notes, created_at, holding:investment_holdings(stock_code)"
    )
    .eq("household_id", auth.householdId)
    .order("purchase_month", { ascending: false })

  if (holdingId) {
    query = query.eq("holding_id", holdingId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = createPurchaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("investment_purchases")
    .insert({ ...parsed.data, household_id: auth.householdId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
