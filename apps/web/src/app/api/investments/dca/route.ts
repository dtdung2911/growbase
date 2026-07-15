import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createDcaPlanSchema } from "@growbase/shared/schemas/investment"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("investment_dca_plans")
    .select(
      "id, household_id, stock_code, target_allocation_pct, is_active, created_at"
    )
    .eq("household_id", auth.householdId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = createDcaPlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("investment_dca_plans")
    .upsert(
      { ...parsed.data, household_id: auth.householdId },
      { onConflict: "household_id,stock_code" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
