import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createDebtSchema } from "@growbase/shared/schemas/debt"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("debt_entries")
    .select(
      "id, creditor_name, debt_type, total_amount, remaining_amount, monthly_payment, status, interest_rate"
    )
    .eq("household_id", auth.householdId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = createDebtSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("debt_entries")
    .insert({
      ...parsed.data,
      household_id: auth.householdId,
      remaining_amount: parsed.data.remaining_amount ?? parsed.data.total_amount,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
