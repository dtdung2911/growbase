export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { withAuthUser } from "@/lib/supabase/auth-check"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { completeOnboardingV2Schema } from "@/lib/validations/onboardingV2"
import { PRESET_ICON_NAMES } from "@/components/onboarding/v2/goalPresetIcons"
import { addMonthsIso } from "@/lib/utils/date"
import {
  BUDGET_TEMPLATE,
  EMERGENCY_FUND_MONTHS,
  EMERGENCY_FUND_TIMELINE_MONTHS,
  estimateEmergencyTarget,
  calculateFeasibility,
  calculateAggregateFeasibility,
  calculateTodayRemaining,
} from "@/lib/constants/budgetTemplate"

// Tên do server tạo, localize theo locale user (fund names đã localize sẵn client-side trong p_goals)
const LOCALIZED_NAMES = {
  vi: { emergencyFund: "Quỹ khẩn cấp", householdPrefix: "Gia đình của ", incomeSource: "Thu nhập hộ gia đình", account: "Tài khoản chính" },
  en: { emergencyFund: "Emergency Fund", householdPrefix: "Family of ", incomeSource: "Household Income", account: "Main Account" },
} as const

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

  const { goals, monthlyIncome, locale } = parsed.data
  const names = LOCALIZED_NAMES[locale]

  const emergencyTarget = estimateEmergencyTarget(monthlyIncome)
  const funds = [
    {
      name: names.emergencyFund,
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

  // Contract migration 016: phần tử [0] LUÔN là emergency, tiếp theo là các goal fund.
  const p_goals = [
    {
      fund_type: "emergency",
      name: names.emergencyFund,
      target_amount: emergencyTarget,
      target_date: null,
      target_months_expense: EMERGENCY_FUND_MONTHS,
      icon: PRESET_ICON_NAMES.emergency,
    },
    // preset icon là single source of truth từ presetId (server-side); custom lấy icon user đã validate
    ...goals.map((g) => ({
      fund_type: "goal",
      name: g.name,
      target_amount: g.targetAmount,
      target_date: addMonthsIso(g.targetMonths!),
      target_months_expense: null,
      icon: g.presetId === "custom" ? g.icon : PRESET_ICON_NAMES[g.presetId] ?? PRESET_ICON_NAMES.custom,
    })),
  ]

  // AD-2: Onboarding create là System Op → supabaseAdmin, không phải user-scoped client
  const { data: rpcResult, error } = await supabaseAdmin.rpc("complete_onboarding_v2", {
    p_user_id: user.id,
    p_display_name: user.user_metadata?.full_name ?? user.email ?? "Owner",
    p_monthly_income: monthlyIncome,
    p_budget_pcts,
    p_goals,
    p_household_name_prefix: names.householdPrefix,
    p_income_source_name: names.incomeSource,
    p_account_name: names.account,
  })

  if (error) {
    if (error.message.includes("Already onboarded")) {
      return NextResponse.json({ data: null, error: "already_onboarded" }, { status: 409 })
    }
    console.error("complete_onboarding_v2 failed:", error)
    return NextResponse.json({ data: null, error: "Không khởi tạo được" }, { status: 500 })
  }

  const { household_id: householdId, fund_ids: fundIds } = rpcResult as {
    household_id: string
    fund_ids: string[]
  }

  // fund_ids theo đúng thứ tự p_goals (= thứ tự funds): map id vào từng quỹ để client match.
  const fundsWithId = funds.map((f, i) => ({ ...f, id: fundIds[i] }))

  // available giống nhau mọi fund (income − budget chi tiêu).
  const feasibility = calculateAggregateFeasibility(
    funds.map((f) => f.feasibility.monthlyNeeded),
    funds[0].feasibility.available
  )

  return NextResponse.json({
    data: {
      householdId,
      funds: fundsWithId,
      feasibility,
      todayRemaining: calculateTodayRemaining(monthlyIncome),
    },
    error: null,
  })
}
