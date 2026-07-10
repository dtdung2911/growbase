import { describe, it, expect } from "vitest"
import { planGoalChannels } from "../planDetail"
import type { AllocationPlan, FundAllocation } from "@/lib/constants/budgetTemplate"

function makePlan(allocations: FundAllocation[], capacityMonthly = 5_000_000): AllocationPlan {
  return {
    capacityMonthly,
    emergencyTarget: 30_000_000,
    stage1EndMonth: 6,
    stage2EndMonth: 12,
    allocations: [{ id: "emergency", monthlyAmount: 3_000_000, timelineMonths: 12 }, ...allocations],
  }
}

describe("planGoalChannels", () => {
  it("bỏ qua goal ngắn hạn (baseline <= 24 tháng)", () => {
    const plan = makePlan([{ id: "g1", monthlyAmount: 2_000_000, timelineMonths: 12 }])
    const channels = planGoalChannels(plan, new Map([["g1", 24_000_000]]))
    expect(channels).toHaveLength(0)
  })

  it("biên baseline 24 → bỏ qua (== maxMonths tầng 1)", () => {
    const plan = makePlan([{ id: "g1", monthlyAmount: 2_000_000, timelineMonths: 24 }])
    expect(planGoalChannels(plan, new Map([["g1", 48_000_000]]))).toHaveLength(0)
  })

  it("biên baseline 25 → liệt kê, tầng bonds", () => {
    const plan = makePlan([{ id: "g1", monthlyAmount: 2_000_000, timelineMonths: 25 }])
    const [c] = planGoalChannels(plan, new Map([["g1", 50_000_000]]))
    expect(c.baseline).toBe(25)
    expect(c.tierKey).toBe("bonds")
  })

  it("bỏ qua goal không có target trong map", () => {
    const plan = makePlan([{ id: "g1", monthlyAmount: 2_000_000, timelineMonths: 40 }])
    expect(planGoalChannels(plan, new Map())).toHaveLength(0)
  })

  it("goal dài hạn chọn tầng bonds 6,5% (24 < baseline <= 60)", () => {
    const plan = makePlan([{ id: "g1", monthlyAmount: 5_000_000, timelineMonths: 40 }])
    const [c] = planGoalChannels(plan, new Map([["g1", 200_000_000]]))
    expect(c.tierKey).toBe("bonds")
    expect(c.annualRate).toBe(0.065)
    expect(c.baseline).toBe(40)
  })

  it("baseline null → tầng index 8% và luôn hiện mọi compound hữu hạn", () => {
    const plan = makePlan([{ id: "g1", monthlyAmount: 3_000_000, timelineMonths: null }])
    const [c] = planGoalChannels(plan, new Map([["g1", 100_000_000]]))
    expect(c.tierKey).toBe("index")
    expect(c.annualRate).toBe(0.08)
    expect(c.baseline).toBeNull()
    expect(c.compoundMonths).not.toBeNull()
    expect(c.compoundMonths! < 100_000).toBe(true)
  })

  it("monthlyAmount null → C = capacityMonthly × ladderWeights[rank]", () => {
    const plan = makePlan(
      [
        { id: "g1", monthlyAmount: null, timelineMonths: null },
        { id: "g2", monthlyAmount: 1_000_000, timelineMonths: 100 },
      ],
      5_000_000,
    )
    const channels = planGoalChannels(plan, new Map([["g1", 100_000_000], ["g2", 200_000_000]]))
    const g1 = channels.find((c) => c.id === "g1")!
    // rank 0 weight 0.7 → C = 3.5tr → compound tầng index hữu hạn (không undefined/NaN)
    expect(g1.compoundMonths).not.toBeNull()
    expect(Number.isFinite(g1.compoundMonths!)).toBe(true)
  })

  it("compound không rút ngắn (C=0) → vẫn liệt kê nhưng compoundMonths null", () => {
    const plan = makePlan([{ id: "g1", monthlyAmount: 0, timelineMonths: 30 }], 0)
    const [c] = planGoalChannels(plan, new Map([["g1", 50_000_000]]))
    expect(c.baseline).toBe(30)
    expect(c.compoundMonths).toBeNull()
  })
})
