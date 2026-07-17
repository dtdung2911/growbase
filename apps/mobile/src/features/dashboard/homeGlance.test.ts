import type { BudgetActualLine } from "@growbase/shared/types/app"
import { describe, expect, it } from "vitest"
import { getBudgetUsage, getDailyAllowance } from "@/features/dashboard/homeGlance"

function line(name: string, budget: number, actual: number): BudgetActualLine {
  return {
    cost_type_id: name,
    cost_type_code: name,
    cost_type_name: name,
    budget_pct: 0,
    override_pct: null,
    effective_pct: 0,
    budget_amount: budget,
    actual_amount: actual,
    remaining: budget - actual,
    usage_pct: budget > 0 ? (actual / budget) * 100 : 0,
  }
}

const JAN_1 = new Date(2026, 0, 1) // 31 ngày còn lại → chia đều dễ kiểm

describe("getDailyAllowance", () => {
  it("returns null when no budget lines", () => {
    expect(getDailyAllowance([], "2026-01", JAN_1)).toBeNull()
  })

  it("returns null when only fixed lines exist", () => {
    expect(getDailyAllowance([line("Nhà ở & Điện nước", 5_000_000, 1_000_000)], "2026-01", JAN_1)).toBeNull()
  })

  it("returns null when flexible budget is 0", () => {
    expect(getDailyAllowance([line("Ăn uống ngoài", 0, 0)], "2026-01", JAN_1)).toBeNull()
  })

  it("returns null when viewing a month other than the device's current month", () => {
    expect(getDailyAllowance([line("Ăn uống ngoài", 3_100_000, 0)], "2026-02", JAN_1)).toBeNull()
  })

  it("computes daily amount from flexible lines, not overspent", () => {
    const result = getDailyAllowance([line("Ăn uống ngoài", 3_100_000, 0)], "2026-01", JAN_1)
    expect(result).toEqual({ amount: 100_000, overspent: false })
  })

  it("clamps to 0 and flags overspent when spent exceeds flexible budget", () => {
    const result = getDailyAllowance([line("Ăn uống ngoài", 100_000, 500_000)], "2026-01", JAN_1)
    expect(result).toEqual({ amount: 0, overspent: true })
  })

  it("ignores fixed lines when summing flexible budget", () => {
    const result = getDailyAllowance(
      [line("Nhà ở & Điện nước", 9_000_000, 9_000_000), line("Giải trí", 3_100_000, 0)],
      "2026-01",
      JAN_1,
    )
    expect(result).toEqual({ amount: 100_000, overspent: false })
  })
})

describe("getBudgetUsage", () => {
  it("computes usage percentage across all lines", () => {
    const usage = getBudgetUsage(800_000, [line("Ăn uống ngoài", 1_000_000, 800_000)])
    expect(usage).toEqual({ totalBudget: 1_000_000, usagePct: 80, over: false })
  })

  it("returns null usagePct when total budget is 0", () => {
    const usage = getBudgetUsage(500_000, [line("Ăn uống ngoài", 0, 0)])
    expect(usage).toEqual({ totalBudget: 0, usagePct: null, over: true })
  })

  it("reports over 100% when expense exceeds budget", () => {
    const usage = getBudgetUsage(1_200_000, [line("Ăn uống ngoài", 1_000_000, 1_200_000)])
    expect(usage).toEqual({ totalBudget: 1_000_000, usagePct: 120, over: true })
  })

  it("flags over even when rounding hides it (100.4% → 100%)", () => {
    const usage = getBudgetUsage(1_004_000, [line("Ăn uống ngoài", 1_000_000, 1_004_000)])
    expect(usage).toEqual({ totalBudget: 1_000_000, usagePct: 100, over: true })
  })
})
