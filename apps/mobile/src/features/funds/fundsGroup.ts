import { computeGoalProgress, goalProgressInputFromFund } from "@growbase/shared/rules/goalProgress"
import type { Fund, FundType } from "@growbase/shared/types/app"

export const FUND_GROUP_ORDER: FundType[] = ["emergency", "sinking", "goal", "investment", "freedom"]

export type FundGroup = { type: FundType; funds: Fund[] }
export type FundStatus = { progressPct: number | null; targetAmount: number | null }

// Subset of Ionicons glyph names — kept as literals so this module stays node-testable
// (no @expo/vector-icons import) while still assignable to the Ionicons `name` prop.
export type FundIonicon = "shield" | "wallet" | "flag" | "trending-up" | "sparkles"

const ICON_BY_TYPE: Record<FundType, FundIonicon> = {
  emergency: "shield",
  sinking: "wallet",
  goal: "flag",
  investment: "trending-up",
  freedom: "sparkles",
}

export function fundIconFor(type: FundType): FundIonicon {
  return ICON_BY_TYPE[type]
}

export function groupFunds(funds: Fund[]): FundGroup[] {
  return FUND_GROUP_ORDER.map((type) => ({
    type,
    funds: type === "goal" ? funds.filter((f) => f.fund_type === type).sort(compareGoal) : funds.filter((f) => f.fund_type === type),
  })).filter((group) => group.funds.length > 0)
}

function compareGoal(a: Fund, b: Fund): number {
  if (a.priority_rank !== b.priority_rank) {
    if (a.priority_rank == null) return 1
    if (b.priority_rank == null) return -1
    return a.priority_rank - b.priority_rank
  }
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

export function deriveFundStatus(fund: Fund): FundStatus {
  if (fund.fund_type === "goal") {
    const progress = computeGoalProgress(goalProgressInputFromFund(fund))
    return {
      progressPct: progress ? clamp(progress.actualRatio * 100, 0, 100) : null,
      targetAmount: fund.target_amount,
    }
  }
  const target = fund.target_amount
  if (!target || target <= 0) return { progressPct: null, targetAmount: null }
  return { progressPct: clamp((fund.current_balance / target) * 100, 0, 100), targetAmount: target }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max))
}
