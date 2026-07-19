import { describe, expect, it } from "vitest"
import { resolveMilestoneCelebration } from "@growbase/shared/rules/goalMilestone"
import type { Fund } from "@growbase/shared/types/app"

function fund(overrides: Partial<Fund>): Fund {
  return {
    id: "f1",
    household_id: "h1",
    name: "Mua nhà",
    description: null,
    fund_type: "goal",
    current_balance: 0,
    target_amount: 100_000_000,
    monthly_contribution: null,
    contribution_day: 1,
    expected_return_rate: null,
    target_date: "2026-10-28",
    target_months_expense: null,
    reset_monthly: false,
    release_trigger: null,
    released_at: null,
    color: null,
    icon: null,
    is_active: true,
    priority: 0,
    priority_rank: null,
    per_member: false,
    amount_per_member: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00+07:00",
    ...overrides,
  }
}

describe("resolveMilestoneCelebration", () => {
  it("vượt 1 mốc so với seen → celebrate mốc đó, nextSeen cập nhật", () => {
    const { celebration, nextSeen } = resolveMilestoneCelebration(
      [fund({ current_balance: 27_000_000 })],
      { f1: 10 }
    )
    expect(celebration).toEqual({ fundId: "f1", fundName: "Mua nhà", milestone: 25 })
    expect(nextSeen.f1).toBe(25)
  })

  it("nhảy nhiều mốc (5% → 60%) → chúc mốc cao nhất 50, một celebration duy nhất", () => {
    const { celebration, nextSeen } = resolveMilestoneCelebration(
      [fund({ current_balance: 60_000_000 })],
      { f1: 0 }
    )
    expect(celebration!.milestone).toBe(50)
    expect(nextSeen.f1).toBe(50)
  })

  it("baseline init: fund chưa có trong seen → KHÔNG celebrate, chỉ ghi tier hiện tại", () => {
    const { celebration, nextSeen } = resolveMilestoneCelebration(
      [fund({ current_balance: 60_000_000 })],
      {}
    )
    expect(celebration).toBeNull()
    expect(nextSeen.f1).toBe(50)
  })

  it("mở app lần 2 với seen đã cập nhật → null (không lặp)", () => {
    const first = resolveMilestoneCelebration([fund({ current_balance: 27_000_000 })], { f1: 10 })
    const second = resolveMilestoneCelebration([fund({ current_balance: 27_000_000 })], first.nextSeen)
    expect(second.celebration).toBeNull()
  })

  it("2 fund cùng vượt → 1 celebration mốc cao nhất", () => {
    const funds = [
      fund({ id: "f1", name: "Mua nhà", current_balance: 27_000_000 }), // vượt 25
      fund({ id: "f2", name: "Du học", current_balance: 80_000_000 }), // vượt 75
    ]
    const { celebration, nextSeen } = resolveMilestoneCelebration(funds, { f1: 10, f2: 50 })
    expect(celebration).toEqual({ fundId: "f2", fundName: "Du học", milestone: 75 })
    expect(nextSeen).toEqual({ f1: 25, f2: 75 })
  })

  it("đạt 100% → celebrate 100", () => {
    const { celebration } = resolveMilestoneCelebration(
      [fund({ current_balance: 100_000_000 })],
      { f1: 75 }
    )
    expect(celebration!.milestone).toBe(100)
  })

  it("target null/0 hoặc fund không phải goal → bỏ qua", () => {
    const r1 = resolveMilestoneCelebration([fund({ target_amount: null, current_balance: 50 })], {})
    expect(r1.celebration).toBeNull()
    expect(r1.nextSeen).toEqual({})

    const r2 = resolveMilestoneCelebration(
      [fund({ fund_type: "emergency", current_balance: 60_000_000 })],
      { f1: 10 }
    )
    expect(r2.celebration).toBeNull()
  })

  it("balance tụt dưới mốc đã thấy → không celebrate lại, seen giữ max (không hạ)", () => {
    const { celebration, nextSeen } = resolveMilestoneCelebration(
      [fund({ current_balance: 20_000_000 })], // tier 10
      { f1: 50 }
    )
    expect(celebration).toBeNull()
    expect(nextSeen.f1).toBe(50)
  })
})
