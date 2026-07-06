export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { withAuthUser } from "@/lib/supabase/auth-check"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { completeOnboardingV2Schema } from "@/lib/validations/onboardingV2"
import { addMonthsIso } from "@/lib/utils/date"
import {
  BUDGET_TEMPLATE,
  EMERGENCY_FUND_MONTHS,
  EMERGENCY_FUND_TIMELINE_MONTHS,
  estimateEmergencyTarget,
  calculateFeasibility,
  calculateTodayRemaining,
} from "@/lib/constants/budgetTemplate"

// AD-1: auth check trước tiên. withAuthUser() (không phải withAuth()) vì user chưa có household.
export async function POST(req: Request) {
  const auth = await withAuthUser()
  if (auth.error) return auth.error
  const { user } = auth

  const body = await req.json().catch(() => null)
  const parsed = completeOnboardingV2Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { goal, monthlyIncome } = parsed.data

  const targetAmount = goal.targetAmount ?? estimateEmergencyTarget(monthlyIncome)
  const months = goal.fundType === "emergency" ? EMERGENCY_FUND_TIMELINE_MONTHS : goal.targetMonths!

  const targetDate = goal.fundType === "goal" ? addMonthsIso(goal.targetMonths!) : null
  const targetMonthsExpense = goal.fundType === "emergency" ? EMERGENCY_FUND_MONTHS : null

  const p_budget_pcts = BUDGET_TEMPLATE.map((b) => ({
    name: b.name,
    budget_pct: b.budgetPct,
    linked_group_names: b.linkedCategoryGroupNames,
  }))

  // AD-2: Onboarding create là System Op → supabaseAdmin, không phải user-scoped client
  const { data: householdId, error } = await supabaseAdmin.rpc("complete_onboarding_v2", {
    p_user_id: user.id,
    p_display_name: user.user_metadata?.full_name ?? user.email ?? "Owner",
    p_monthly_income: monthlyIncome,
    p_budget_pcts,
    p_goal: {
      fund_type: goal.fundType,
      name: goal.name,
      target_amount: targetAmount,
      target_date: targetDate,
      target_months_expense: targetMonthsExpense,
    },
  })

  if (error) {
    if (error.message.includes("Already onboarded")) {
      return NextResponse.json({ data: null, error: "Already onboarded" }, { status: 409 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      householdId,
      feasibility: calculateFeasibility(targetAmount, months, monthlyIncome),
      todayRemaining: calculateTodayRemaining(monthlyIncome),
    },
    error: null,
  })
}
