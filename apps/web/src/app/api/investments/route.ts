import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createHoldingSchema } from "@growbase/shared/schemas/investment"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("investment_holdings")
    .select(
      "id, household_id, stock_code, weight_pct, total_invested, current_value, notes, sort_order, created_at, updated_at"
    )
    .eq("household_id", auth.householdId)
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = createHoldingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("investment_holdings")
    .insert({ ...parsed.data, household_id: auth.householdId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
