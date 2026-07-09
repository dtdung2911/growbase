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

const EMERGENCY_FUND_NAME = "Quỹ khẩn cấp"

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

  const { goals, monthlyIncome } = parsed.data

  const emergencyTarget = estimateEmergencyTarget(monthlyIncome)
  const funds = [
    {
      name: EMERGENCY_FUND_NAME,
      fundType: "emergency" as const,
      presetId: "emergency",
      targetAmount: emergencyTarget,
      months: EMERGENCY_FUND_TIMELINE_MONTHS,
      feasibility: calculateFeasibility(emergencyTarget, EMERGENCY_FUND_TIMELINE_MONTHS, monthlyIncome),
    },
    ...goals.map((g) => ({
      name: g.name,
      fundType: "goal" as const,
      presetId: g.presetId,
      targetAmount: g.targetAmount!,
      months: g.targetMonths!,
      feasibility: calculateFeasibility(g.targetAmount!, g.targetMonths!, monthlyIncome),
    })),
  ]

  const p_budget_pcts = BUDGET_TEMPLATE.map((b) => ({
    name: b.name,
    budget_pct: b.budgetPct,
    linked_group_names: b.linkedCategoryGroupNames,
  }))

  // Contract migration 013: phần tử [0] LUÔN là emergency, tiếp theo là các goal fund.
  const p_goals = [
    {
      fund_type: "emergency",
      name: EMERGENCY_FUND_NAME,
      target_amount: emergencyTarget,
      target_date: null,
      target_months_expense: EMERGENCY_FUND_MONTHS,
    },
    ...goals.map((g) => ({
      fund_type: "goal",
      name: g.name,
      target_amount: g.targetAmount,
      target_date: addMonthsIso(g.targetMonths!),
      target_months_expense: null,
    })),
  ]

  // AD-2: Onboarding create là System Op → supabaseAdmin, không phải user-scoped client
  const { data: householdId, error } = await supabaseAdmin.rpc("complete_onboarding_v2", {
    p_user_id: user.id,
    p_display_name: user.user_metadata?.full_name ?? user.email ?? "Owner",
    p_monthly_income: monthlyIncome,
    p_budget_pcts,
    p_goals,
  })

  if (error) {
    if (error.message.includes("Already onboarded")) {
      return NextResponse.json({ data: null, error: "Already onboarded" }, { status: 409 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  // Feasibility tổng: available giống nhau mọi fund (income − budget chi tiêu), monthlyNeeded cộng dồn.
  const available = funds[0].feasibility.available
  const monthlyNeeded = funds.reduce((sum, f) => sum + f.feasibility.monthlyNeeded, 0)

  return NextResponse.json({
    data: {
      householdId,
      funds,
      feasibility: { monthlyNeeded, available, feasible: monthlyNeeded <= available + 1 },
      todayRemaining: calculateTodayRemaining(monthlyIncome),
    },
    error: null,
  })
}
