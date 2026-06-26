import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createFundSchema } from "@/lib/validations/fund"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("funds")
    .select("*")
    .eq("household_id", auth.householdId)
    .eq("is_active", true)
    .order("priority", { ascending: true })
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
  const parsed = createFundSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const input = parsed.data

  const { data, error } = await auth.supabase
    .from("funds")
    .insert({
      household_id: auth.householdId,
      name: input.name,
      description: input.description ?? null,
      fund_type: input.fund_type,
      icon: input.icon ?? null,
      color: input.color ?? null,
      monthly_contribution: input.monthly_contribution ?? 0,
      contribution_day: input.contribution_day ?? 1,
      target_amount: input.target_amount ?? null,
      target_date: input.target_date ?? null,
      target_months_expense: input.target_months_expense ?? null,
      expected_return_rate: input.expected_return_rate ?? null,
      reset_monthly: input.fund_type === "freedom",
      priority: input.priority ?? 5,
      per_member: input.per_member ?? false,
      amount_per_member: input.amount_per_member ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
