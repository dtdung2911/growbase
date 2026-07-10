import { describe, it, expect } from "vitest"
import {
  calculateAllocationPlan,
  estimateEmergencyTarget,
  sumBudgetPct,
  SPENDING_COST_TYPE_GROUPS,
} from "@/lib/constants/budgetTemplate"

// Story 12.1 dùng calculateAllocationPlan với input thật (rank sort ở route, initialBalance = balance thật).
// Các test dưới khẳng định engine tiêu thụ đúng thứ tự hạng + initialBalance + emergency balance.
const INCOME = 10_000_000

describe("Living Plan engine input mapping (AC3)", () => {
  it("rank sort: allocations = emergency rồi goals theo thứ tự input (hạng)", () => {
    const plan = calculateAllocationPlan({
      monthlyIncome: INCOME,
      emergencyBalance: estimateEmergencyTarget(INCOME),
      goals: [
        { id: "a", targetAmount: 1_000_000 },
        { id: "b", targetAmount: 1_000_000 },
      ],
    })
    expect(plan.allocations.map((x) => x.id)).toEqual(["emergency", "a", "b"])
  })

  it("goal mới chen rank cuối → recompute, quỹ hạng cuối xong không sớm hơn hạng đầu", () => {
    const goals = [
      { id: "a", targetAmount: 1_000_000 },
      { id: "b", targetAmount: 1_000_000 },
      { id: "c", targetAmount: 1_000_000 },
    ]
    const plan = calculateAllocationPlan({
      monthlyIncome: INCOME,
      emergencyBalance: estimateEmergencyTarget(INCOME),
      goals,
    })
    expect(plan.allocations.map((x) => x.id)).toEqual(["emergency", "a", "b", "c"])
    const a = plan.allocations[1].timelineMonths
    const c = plan.allocations[3].timelineMonths
    expect(a).not.toBeNull()
    expect(c).not.toBeNull()
    expect(c as number).toBeGreaterThanOrEqual(a as number)
  })

  it("initialBalance từ balance thật: quỹ đã đầy sẵn → timeline 0, góp 0đ/tháng", () => {
    const plan = calculateAllocationPlan({
      monthlyIncome: INCOME,
      emergencyBalance: estimateEmergencyTarget(INCOME),
      goals: [{ id: "full", targetAmount: 2_000_000, initialBalance: 2_000_000 }],
    })
    const goal = plan.allocations[1]
    expect(goal.timelineMonths).toBe(0)
    expect(goal.monthlyAmount).toBe(0)
  })

  it("initialBalance rút ngắn timeline so với bắt đầu từ 0", () => {
    const base = {
      monthlyIncome: INCOME,
      emergencyBalance: estimateEmergencyTarget(INCOME),
    }
    const fromZero = calculateAllocationPlan({
      ...base,
      goals: [{ id: "g", targetAmount: 5_000_000, initialBalance: 0 }],
    })
    const nearFull = calculateAllocationPlan({
      ...base,
      goals: [{ id: "g", targetAmount: 5_000_000, initialBalance: 4_500_000 }],
    })
    expect(nearFull.allocations[1].timelineMonths as number).toBeLessThanOrEqual(
      fromZero.allocations[1].timelineMonths as number
    )
  })

  it("emergency đầy một phần từ balance thật: past stage1 → stage1EndMonth 0, chưa đầy → stage2 > 0", () => {
    const target = estimateEmergencyTarget(INCOME)
    const stage1 = INCOME * (sumBudgetPct(SPENDING_COST_TYPE_GROUPS) / 100)
    const partial = Math.round((stage1 + target) / 2) // đã qua 1× chi tiêu, chưa đạt 3×
    const plan = calculateAllocationPlan({
      monthlyIncome: INCOME,
      emergencyBalance: partial,
      goals: [],
    })
    expect(plan.stage1EndMonth).toBe(0)
    expect(plan.stage2EndMonth).not.toBeNull()
    expect(plan.stage2EndMonth as number).toBeGreaterThan(0)
  })
})

describe("calculateAllocationPlan — emergencyTarget override (BR-OB-016)", () => {
  it("không override → target = estimate (regression guard: caller cũ nguyên)", () => {
    const plan = calculateAllocationPlan({ monthlyIncome: INCOME, emergencyBalance: 0, goals: [] })
    expect(plan.emergencyTarget).toBe(estimateEmergencyTarget(INCOME))
  })

  it("override nhỏ hơn estimate → target theo DB, stage2 đạt sớm hơn", () => {
    const small = Math.round(estimateEmergencyTarget(INCOME) / 2)
    const def = calculateAllocationPlan({ monthlyIncome: INCOME, emergencyBalance: 0, goals: [] })
    const plan = calculateAllocationPlan({
      monthlyIncome: INCOME,
      emergencyBalance: 0,
      goals: [],
      emergencyTarget: small,
    })
    expect(plan.emergencyTarget).toBe(small)
    expect(plan.stage2EndMonth as number).toBeLessThan(def.stage2EndMonth as number)
  })

  it("override lớn hơn estimate → target theo DB, stage2 lâu hơn", () => {
    const big = estimateEmergencyTarget(INCOME) * 3
    const def = calculateAllocationPlan({ monthlyIncome: INCOME, emergencyBalance: 0, goals: [] })
    const plan = calculateAllocationPlan({
      monthlyIncome: INCOME,
      emergencyBalance: 0,
      goals: [],
      emergencyTarget: big,
    })
    expect(plan.emergencyTarget).toBe(big)
    expect(plan.stage2EndMonth as number).toBeGreaterThan(def.stage2EndMonth as number)
  })

  it("ngưỡng GĐ1 derive từ target/3 khi override: balance = target/3 → stage1EndMonth 0, chưa đầy → stage2 > 0", () => {
    const target = 120_000_000
    const plan = calculateAllocationPlan({
      monthlyIncome: INCOME,
      emergencyBalance: target / 3,
      goals: [],
      emergencyTarget: target,
    })
    expect(plan.stage1EndMonth).toBe(0)
    expect(plan.stage2EndMonth as number).toBeGreaterThan(0)
  })
})
