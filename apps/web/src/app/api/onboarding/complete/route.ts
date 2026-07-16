export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { withAuthUser } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { completeOnboardingV2Schema } from "@growbase/shared/schemas/onboardingV2"
import { PRESET_ICON_NAMES } from "@growbase/shared/constants/fundIcons"
import { addMonthsIso } from "@growbase/shared/rules/date"
import {
  BUDGET_TEMPLATE,
  EMERGENCY_FUND_MONTHS,
  estimateEmergencyTarget,
  calculateAllocationPlan,
  calculateTodayRemaining,
} from "@growbase/shared/constants/budgetTemplate"

// Tên do server tạo, localize theo locale user (fund names đã localize sẵn client-side trong p_goals)
const LOCALIZED_NAMES = {
  vi: { emergencyFund: "Quỹ khẩn cấp", householdPrefix: "Gia đình của ", incomeSource: "Thu nhập hộ gia đình", account: "Tài khoản chính", initFailed: "Không khởi tạo được" },
  en: { emergencyFund: "Emergency Fund", householdPrefix: "Family of ", incomeSource: "Household Income", account: "Main Account", initFailed: "Setup failed" },
} as const

// AD-1: auth check trước tiên. withAuthUser() (không phải withAuth()) vì user chưa có household.
export async function POST(req: Request) {
  const auth = await withAuthUser()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, req, async () => {
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

    // Engine chỉ để suy ra target_date mỗi goal fund; client (TadaStep) tự re-run cho storytelling.
    const plan = calculateAllocationPlan({
      monthlyIncome,
      goals: goals.map((g, i) => ({ id: String(i), targetAmount: g.targetAmount! })),
    })
    const goalAllocs = plan.allocations.slice(1)

    const funds = [
      {
        name: names.emergencyFund,
        fundType: "emergency" as const,
        presetId: "emergency",
        targetAmount: emergencyTarget,
      },
      ...goals.map((g) => ({
        name: g.name,
        fundType: "goal" as const,
        presetId: g.presetId,
        targetAmount: g.targetAmount!,
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
      ...goals.map((g, i) => ({
        fund_type: "goal",
        name: g.name,
        target_amount: g.targetAmount,
        target_date: goalAllocs[i].timelineMonths !== null ? addMonthsIso(goalAllocs[i].timelineMonths!) : null,
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
      return NextResponse.json({ data: null, error: names.initFailed }, { status: 500 })
    }

    // RPC trả jsonb: shape có thể lệch nếu migration chưa push. Validate trước destructure
    // để tránh TypeError thô (household_id null) hoặc fund.id undefined (fund_ids ngắn).
    const result = rpcResult as { household_id?: unknown; fund_ids?: unknown } | null
    const householdId = result?.household_id
    const fundIds = result?.fund_ids
    if (
      typeof householdId !== "string" ||
      !Array.isArray(fundIds) ||
      fundIds.length !== funds.length
    ) {
      console.error("complete_onboarding_v2 malformed result:", { rpcResult, expectedFunds: funds.length })
      return NextResponse.json({ data: null, error: names.initFailed }, { status: 500 })
    }

    // fund_ids theo đúng thứ tự p_goals (= thứ tự funds): map id vào từng quỹ để client match.
    const fundsWithId = funds.map((f, i) => ({ ...f, id: fundIds[i] }))

    return NextResponse.json({
      data: {
        householdId,
        funds: fundsWithId,
        todayRemaining: calculateTodayRemaining(monthlyIncome),
      },
      error: null,
    })
  })
}
