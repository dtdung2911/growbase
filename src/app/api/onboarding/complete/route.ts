import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { completeOnboardingSchema } from "@/lib/validations/onboarding"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = completeOnboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }
  const { householdId, incomes, accounts, debts, budgetPcts } = parsed.data

  const p_income_sources = incomes.map((i) => ({
    source_name: i.sourceName,
    monthly_amount: i.monthlyAmount,
    member_id: i.memberId ?? null,
  }))

  const p_accounts = accounts.map((a) => ({
    name: a.name,
    bank_name: a.bankName ?? null,
    account_type: a.accountType,
    owner_name: a.ownerName ?? null,
    is_credit_card: a.isCreditCard,
  }))

  const p_debt_entries = debts.map((d) => ({
    creditor_name: d.creditorName,
    debt_type: d.debtType,
    total_amount: d.totalAmount,
    remaining_amount: d.remainingAmount ?? null,
    monthly_payment: d.monthlyPayment,
    expected_end_date: d.expectedEndDate ?? null,
    member_id: d.memberId ?? null,
  }))

  const p_budget_pcts = budgetPcts.map((b) => ({
    name: b.name,
    budget_pct: b.budgetPct,
    linked_group_names: b.linkedCategoryGroupNames,
  }))

  const { data, error } = await supabase.rpc("complete_onboarding", {
    p_household_id: householdId,
    p_income_sources: p_income_sources,
    p_accounts: p_accounts,
    p_debt_entries: p_debt_entries,
    p_budget_pcts: p_budget_pcts,
  })

  if (error) {
    const msg = error.message
    if (msg.includes("Access denied")) {
      return NextResponse.json({ data: null, error: "Access denied" }, { status: 403 })
    }
    if (msg.includes("Household not found")) {
      return NextResponse.json(
        { data: null, error: "Household not found" },
        { status: 404 }
      )
    }
    if (msg.includes("already completed")) {
      return NextResponse.json(
        { data: null, error: "Onboarding already completed" },
        { status: 409 }
      )
    }
    return NextResponse.json({ data: null, error: msg }, { status: 500 })
  }

  return NextResponse.json({ data: { householdId: data }, error: null })
}
