import type { Fund } from "@growbase/shared/types/app"
import { describe, expect, it } from "vitest"
import { deriveFundStatus, FUND_GROUP_ORDER, fundIconFor, groupFunds } from "./fundsGroup"

function makeFund(overrides: Partial<Fund> & Pick<Fund, "id" | "fund_type">): Fund {
  return {
    household_id: "h1",
    name: overrides.id,
    description: null,
    current_balance: 0,
    target_amount: null,
    monthly_contribution: null,
    contribution_day: 1,
    expected_return_rate: null,
    target_date: null,
    target_months_expense: null,
    reset_monthly: false,
    release_trigger: null,
    released_at: null,
    color: null,
    icon: null,
    is_active: true,
    priority: 5,
    priority_rank: null,
    per_member: false,
    amount_per_member: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("groupFunds", () => {
  it("groups funds in fixed order regardless of input order", () => {
    const funds = [
      makeFund({ id: "free", fund_type: "freedom" }),
      makeFund({ id: "emg", fund_type: "emergency" }),
      makeFund({ id: "goal", fund_type: "goal" }),
    ]
    expect(groupFunds(funds).map((g) => g.type)).toEqual(["emergency", "goal", "freedom"])
  })

  it("drops empty groups", () => {
    const groups = groupFunds([makeFund({ id: "emg", fund_type: "emergency" })])
    expect(groups.map((g) => g.type)).toEqual(["emergency"])
    expect(groups.some((g) => g.type === "investment")).toBe(false)
  })

  it("sorts goal funds by priority_rank asc with null last", () => {
    const funds = [
      makeFund({ id: "g-null", fund_type: "goal", priority_rank: null }),
      makeFund({ id: "g-1", fund_type: "goal", priority_rank: 1 }),
    ]
    const goalGroup = groupFunds(funds).find((g) => g.type === "goal")
    expect(goalGroup?.funds.map((f) => f.id)).toEqual(["g-1", "g-null"])
  })

  it("keeps API order for non-goal groups", () => {
    const funds = [
      makeFund({ id: "s2", fund_type: "sinking" }),
      makeFund({ id: "s1", fund_type: "sinking" }),
    ]
    const group = groupFunds(funds).find((g) => g.type === "sinking")
    expect(group?.funds.map((f) => f.id)).toEqual(["s2", "s1"])
  })
})

describe("deriveFundStatus", () => {
  it("computes clamped progress when a non-goal fund has a target", () => {
    const status = deriveFundStatus(
      makeFund({ id: "s", fund_type: "sinking", current_balance: 3_000_000, target_amount: 10_000_000 }),
    )
    expect(status).toEqual({ progressPct: 30, targetAmount: 10_000_000 })
  })

  it("returns null progress and never divides by zero when no target", () => {
    expect(deriveFundStatus(makeFund({ id: "a", fund_type: "sinking", current_balance: 5_000_000, target_amount: null }))).toEqual({
      progressPct: null,
      targetAmount: null,
    })
    expect(deriveFundStatus(makeFund({ id: "b", fund_type: "sinking", current_balance: 5_000_000, target_amount: 0 }))).toEqual({
      progressPct: null,
      targetAmount: null,
    })
  })

  it("uses computeGoalProgress for goal funds with a target", () => {
    const status = deriveFundStatus(
      makeFund({
        id: "goal",
        fund_type: "goal",
        current_balance: 5_000_000,
        target_amount: 10_000_000,
        created_at: "2026-01-01",
        target_date: "2026-12-31",
      }),
    )
    expect(status.progressPct).toBe(50)
    expect(status.targetAmount).toBe(10_000_000)
  })

  it("returns null progress for a goal that lacks the data to build an expected line", () => {
    const status = deriveFundStatus(
      makeFund({ id: "goal", fund_type: "goal", current_balance: 1_000_000, target_amount: 10_000_000, target_date: null }),
    )
    expect(status.progressPct).toBeNull()
  })
})

describe("fundIconFor", () => {
  it("maps every fund type to an Ionicons glyph", () => {
    expect(FUND_GROUP_ORDER.map(fundIconFor)).toEqual(["shield", "wallet", "flag", "trending-up", "sparkles"])
  })
})
