import {
  COMPOUND_TIERS,
  compoundTimelineMonths,
  ladderWeights,
  pickCompoundTier,
  type AllocationPlan,
} from "@/lib/constants/budgetTemplate"

export interface PlanGoalChannel {
  id: string
  baseline: number | null // timeline gốc (null = ngoài cap MAX_ALLOCATION_MONTHS)
  tierKey: string // "bonds" | "index" — gate baseline > 24 loại bỏ tầng "savings"
  annualRate: number
  compoundMonths: number | null // hiện khi rút ngắn thật; null = không đáng gợi ý
}

// Kênh dài hạn per goal (mirror GoalStep D2/D3, không split): chỉ goal baseline > tầng 1 (24 tháng)
// hoặc null. C = monthlyAmount avg; null → capacityMonthly × ladderWeights(n)[rank] (steady-state GĐ3,
// xấp xỉ dưới disclaimer). Emergency KHÔNG áp (là an toàn, không phải đầu tư).
export function planGoalChannels(
  plan: AllocationPlan,
  targetById: Map<string, number>,
): PlanGoalChannel[] {
  const goalAllocs = plan.allocations.filter((a) => a.id !== "emergency")
  const weights = ladderWeights(goalAllocs.length)
  const channels: PlanGoalChannel[] = []
  goalAllocs.forEach((alloc, rank) => {
    const target = targetById.get(alloc.id)
    if (target === undefined || target <= 0) return
    const baseline = alloc.timelineMonths
    if (baseline !== null && baseline <= COMPOUND_TIERS[0].maxMonths) return
    const tier = pickCompoundTier(baseline)
    const contribution = alloc.monthlyAmount ?? Math.round(plan.capacityMonthly * (weights[rank] ?? 0))
    const m = compoundTimelineMonths(contribution, target, tier.annualRate)
    const compoundMonths = m !== null && (baseline === null || baseline - m >= 2) ? m : null
    channels.push({ id: alloc.id, baseline, tierKey: tier.key, annualRate: tier.annualRate, compoundMonths })
  })
  return channels
}
