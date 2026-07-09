import { describe, expect, it } from "vitest"
import { resolveActiveGoalFund } from "@/lib/insight/resolveActiveGoalFund"
import type { Fund } from "@/types/app"

function fund(overrides: Partial<Fund>): Fund {
  return {
    id: "f1",
    household_id: "h1",
    name: "Fund",
    description: null,
    fund_type: "emergency",
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
    priority: 0,
    per_member: false,
    amount_per_member: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00+07:00",
    ...overrides,
  }
}

describe("resolveActiveGoalFund", () => {
  it("prefers the goal fund when one exists", () => {
    const funds = [
      fund({ id: "e1", fund_type: "emergency", name: "Quỹ khẩn cấp" }),
      fund({ id: "g1", fund_type: "goal", name: "Quỹ học", monthly_contribution: 3_300_000 }),
    ]

    expect(resolveActiveGoalFund(funds)).toMatchObject({ name: "Quỹ học", monthly_contribution: 3_300_000 })
  })

  it("falls back to the emergency fund when no goal fund exists", () => {
    const funds = [fund({ id: "e1", fund_type: "emergency", name: "Quỹ khẩn cấp", monthly_contribution: 500_000 })]

    expect(resolveActiveGoalFund(funds)).toMatchObject({ name: "Quỹ khẩn cấp", monthly_contribution: 500_000 })
  })

  it("returns null without throwing when there is no goal or emergency fund", () => {
    const funds = [fund({ id: "s1", fund_type: "sinking", name: "Quỹ dự phòng" })]

    expect(resolveActiveGoalFund(funds)).toBeNull()
  })

  it("returns null for an empty fund list", () => {
    expect(resolveActiveGoalFund([])).toBeNull()
  })
})
