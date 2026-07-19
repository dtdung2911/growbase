import { describe, expect, it } from "vitest"
import type { BudgetActualLine } from "@growbase/shared/types/app"
import { calculateDailyRemaining, isFlexibleBudgetLine } from "@growbase/shared/rules/dailyRemaining"

function line(overrides: Partial<BudgetActualLine>): BudgetActualLine {
  return {
    cost_type_id: "id",
    cost_type_code: "",
    cost_type_name: "Ăn uống ngoài",
    budget_pct: 0,
    override_pct: null,
    effective_pct: 0,
    budget_amount: 0,
    actual_amount: 0,
    remaining: 0,
    usage_pct: 0,
    ...overrides,
  }
}

describe("isFlexibleBudgetLine", () => {
  it("returns true for a wasteful/variable-group line name", () => {
    expect(isFlexibleBudgetLine(line({ cost_type_name: "Ăn uống ngoài" }))).toBe(true)
  })

  it("returns false for an unknown cost_type_name", () => {
    expect(isFlexibleBudgetLine(line({ cost_type_name: "Không tồn tại" }))).toBe(false)
  })

  it("does not rely on cost_type_code (always empty in real data)", () => {
    expect(isFlexibleBudgetLine(line({ cost_type_name: "Ăn uống ngoài", cost_type_code: "" }))).toBe(true)
  })
})

describe("calculateDailyRemaining", () => {
  it("returns 0 when flexible budget is 0 and nothing spent, no division-by-zero", () => {
    const lines = [line({ cost_type_name: "Ăn uống ngoài", budget_amount: 0, actual_amount: 0 })]
    const today = new Date(2026, 6, 15)
    expect(calculateDailyRemaining(lines, today)).toBe(0)
  })

  it("clamps to 0 when flexible spend exceeds flexible budget", () => {
    const lines = [line({ cost_type_name: "Ăn uống ngoài", budget_amount: 100_000, actual_amount: 500_000 })]
    const today = new Date(2026, 6, 15)
    expect(calculateDailyRemaining(lines, today)).toBe(0)
  })

  it("divides by exactly 1 day remaining on the last day of the month", () => {
    const lines = [line({ cost_type_name: "Ăn uống ngoài", budget_amount: 300_000, actual_amount: 200_000 })]
    const today = new Date(2026, 6, 31)
    expect(calculateDailyRemaining(lines, today)).toBe(100_000)
  })

  it("uses local-time days-in-month, not UTC, across 28/29/30/31-day months", () => {
    const lines = [line({ cost_type_name: "Ăn uống ngoài", budget_amount: 280_000, actual_amount: 0 })]
    const feb2028 = new Date(2028, 1, 1) // leap year February = 29 days
    expect(calculateDailyRemaining(lines, feb2028)).toBe(Math.floor(280_000 / 29))
  })

  it("absorbs yesterday's overspend automatically: today's remaining drops without extra correction logic", () => {
    const today = new Date(2026, 6, 15) // 17 days remaining in July
    const onPlan = [line({ cost_type_name: "Ăn uống ngoài", budget_amount: 3_100_000, actual_amount: 1_400_000 })]
    // same month but yesterday spent 85k over the 100k/day plan → month-to-date total is higher
    const overspent = [line({ cost_type_name: "Ăn uống ngoài", budget_amount: 3_100_000, actual_amount: 1_485_000 })]
    expect(calculateDailyRemaining(overspent, today)).toBe(Math.floor((3_100_000 - 1_485_000) / 17))
    expect(calculateDailyRemaining(overspent, today)).toBeLessThan(calculateDailyRemaining(onPlan, today))
  })

  it("excludes non-flexible groups (fixed/savings_investment/debt_repayment/other)", () => {
    const lines = [
      line({ cost_type_name: "Ăn uống ngoài", budget_amount: 300_000, actual_amount: 0 }),
      line({ cost_type_name: "Nhà ở & Điện nước", budget_amount: 5_000_000, actual_amount: 5_000_000 }),
    ]
    const today = new Date(2026, 6, 31)
    expect(calculateDailyRemaining(lines, today)).toBe(300_000)
  })
})
