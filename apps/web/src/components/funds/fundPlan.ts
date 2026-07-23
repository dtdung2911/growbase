import {
  COMPOUND_TIERS,
  compoundTimelineMonths,
  ladderWeights,
  pickCompoundTier,
  type AllocationPlan,
  type FundAllocation,
} from "@growbase/shared/constants/budgetTemplate"
import { currentStage } from "@growbase/shared/rules/currentStage"
import { txMonthVN } from "@growbase/shared/rules/date"
import type { Fund, FundTransaction } from "@growbase/shared/types/app"

// Tab "Kế hoạch" chỉ cho quỹ trong allocation engine: emergency (id "emergency") + goal (id thật).
export const FUND_HAS_PLAN: readonly Fund["fund_type"][] = ["emergency", "goal"]

// useLivingPlan trả emergency với id "emergency", goals với fund.id THẬT → match theo type.
export function findFundAllocation(plan: AllocationPlan, fund: Fund): FundAllocation | null {
  const id = fund.fund_type === "emergency" ? "emergency" : fund.id
  return plan.allocations.find((a) => a.id === id) ?? null
}

export type FundChannel = {
  baseline: number | null
  tierKey: string
  annualRate: number
  compoundMonths: number | null // rút ngắn thật (≥2 tháng); null = không đáng gợi ý
}

// Kênh dài hạn cho GOAL đơn lẻ (mirror planGoalChannels) nhưng tính trên phần CÒN LẠI
// target − current_balance vì quỹ đã có số dư thật. Emergency = an toàn ≠ đầu tư → không áp.
export function fundGoalChannel(fund: Fund, plan: AllocationPlan): FundChannel | null {
  if (fund.fund_type !== "goal") return null
  const target = fund.target_amount
  if (target === null || target <= 0) return null

  const goalAllocs = plan.allocations.filter((a) => a.id !== "emergency")
  const rank = goalAllocs.findIndex((a) => a.id === fund.id)
  if (rank === -1) return null
  const alloc = goalAllocs[rank]

  const baseline = alloc.timelineMonths
  if (baseline !== null && baseline <= COMPOUND_TIERS[0].maxMonths) return null // goal ngắn: không gợi ý đầu tư

  const remaining = target - fund.current_balance
  if (remaining <= 0) return null

  const weights = ladderWeights(goalAllocs.length)
  const contribution = alloc.monthlyAmount ?? Math.round(plan.capacityMonthly * (weights[rank] ?? 0))
  const tier = pickCompoundTier(baseline)
  const m = compoundTimelineMonths(contribution, remaining, tier.annualRate)
  const compoundMonths = m !== null && (baseline === null || baseline - m >= 2) ? m : null

  return { baseline, tierKey: tier.key, annualRate: tier.annualRate, compoundMonths }
}

// Đã góp (direction "in") cho quỹ trong tháng yearMonth ("YYYY-MM")? Dùng history đã fetch, không API mới.
export function hasContributedInMonth(history: FundTransaction[], yearMonth: string): boolean {
  return history.some((tx) => tx.direction === "in" && txMonthVN(tx.transaction_date) === yearMonth)
}

// Tổng đã góp (direction "in") trong tháng yearMonth ("YYYY-MM"). Dùng history đã fetch, không API mới.
export function sumContributedInMonth(history: FundTransaction[], yearMonth: string): number {
  return history
    .filter((tx) => tx.direction === "in" && txMonthVN(tx.transaction_date) === yearMonth)
    .reduce((sum, tx) => sum + tx.amount, 0)
}

// Gợi ý góp tháng này = phần capacity tháng dành cho quỹ theo GĐ lá chắn (BR-OB-009..011),
// trừ phần ĐÃ góp trong tháng, sàn 0. null = ngoài engine / hết capacity / GĐ chưa phân bổ cho quỹ
// (advise-not-act: chỉ pre-fill + caption, không khóa input).
export function suggestedContribution({
  fund,
  plan,
  emergencyBalance,
  capacityThisMonth,
  contributedThisMonth,
}: {
  fund: Fund
  plan: AllocationPlan
  emergencyBalance: number
  capacityThisMonth: number
  contributedThisMonth: number
}): number | null {
  if (capacityThisMonth <= 0) return null

  const stage = currentStage(emergencyBalance, plan.emergencyTarget)
  // Goals còn dở (timelineMonths 0 = đã đầy sẵn). Mirror pourGoals: chỉ re-ladder trên quỹ CHƯA đạt.
  const incompleteGoals = plan.allocations.filter(
    (a) => a.id !== "emergency" && a.timelineMonths !== 0,
  )

  let share: number
  let room: number
  if (fund.fund_type === "emergency") {
    if (stage === 3) return null // đã đầy → không gợi ý
    // GĐ1 dồn 100%; GĐ2 giữ 70% (30% sang goal) — hết goal dở thì nhận 100% (mirror engine hasGoals).
    share = stage === 1 || incompleteGoals.length === 0 ? 1 : 0.7
    room = Math.max(0, plan.emergencyTarget - emergencyBalance)
  } else if (fund.fund_type === "goal") {
    const goalPortion = stage === 1 ? 0 : stage === 2 ? 0.3 : 1
    if (goalPortion === 0) return null // GĐ1: 100% dồn lá chắn, goal chưa tới lượt
    room = Math.max(0, (fund.target_amount ?? 0) - fund.current_balance)
    if (room <= 0) return null // quỹ đã đạt → engine cho 0
    const rank = incompleteGoals.findIndex((a) => a.id === fund.id)
    if (rank === -1) return null // ngoài engine hoặc đã đạt
    share = goalPortion * (ladderWeights(incompleteGoals.length)[rank] ?? 0)
  } else {
    return null // sinking/investment/freedom ngoài allocation engine
  }

  // Cap tại room của chính quỹ (mirror engine: 70%/ladder ĐẾN KHI = target, không vượt — BR-OB-010).
  const gross = Math.min(Math.round(capacityThisMonth * share), room)
  return Math.max(0, gross - contributedThisMonth)
}
