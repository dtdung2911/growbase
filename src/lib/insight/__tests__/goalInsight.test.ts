import { describe, expect, it } from "vitest"
import { resolveGoalInsight } from "@/lib/insight/goalInsight"
import type { Fund } from "@/types/app"

function fund(overrides: Partial<Fund>): Fund {
  return {
    id: "f1",
    household_id: "h1",
    name: "Fund",
    description: null,
    fund_type: "goal",
    current_balance: 0,
    target_amount: 120_000_000,
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

// Ngày 150/300: kỳ vọng 60tr — 90tr = ahead 2.5 tháng, 60tr = on-track
const today = new Date(2026, 4, 31)

describe("resolveGoalInsight", () => {
  it("goal fund noteworthy → descriptor từ engine", () => {
    const d = resolveGoalInsight({
      funds: [fund({ name: "Mua nhà", current_balance: 90_000_000 })],
      lastShown: null,
      today,
    })
    expect(d).not.toBeNull()
    expect(d!.i18nKey).toBe("insight.goalAhead")
    expect(d!.params.goalName).toBe("Mua nhà")
  })

  it("on-track → null (không đáng nói)", () => {
    const d = resolveGoalInsight({
      funds: [fund({ current_balance: 60_000_000 })],
      lastShown: null,
      today,
    })
    expect(d).toBeNull()
  })

  it("không có goal/emergency fund → null", () => {
    expect(resolveGoalInsight({ funds: [fund({ fund_type: "sinking" })], lastShown: null, today })).toBeNull()
    expect(resolveGoalInsight({ funds: [], lastShown: null, today })).toBeNull()
  })

  it("goal thiếu target_date (ca Quỹ khẩn cấp onboarding) → null êm", () => {
    const d = resolveGoalInsight({
      funds: [fund({ fund_type: "emergency", target_date: null, current_balance: 90_000_000 })],
      lastShown: null,
      today,
    })
    expect(d).toBeNull()
  })

  it("anti-repeat: cùng câu show hôm qua → null", () => {
    const d = resolveGoalInsight({
      funds: [fund({ current_balance: 90_000_000 })],
      lastShown: { i18nKey: "insight.goalAhead", dateISO: "2026-05-30" },
      today,
    })
    expect(d).toBeNull()
  })

  it("goal bị xoá khỏi danh sách → không narrative mồ côi (chỉ còn emergency thiếu deadline → null)", () => {
    const remaining = [fund({ fund_type: "emergency", target_date: null, current_balance: 90_000_000 })]
    expect(resolveGoalInsight({ funds: remaining, lastShown: null, today })).toBeNull()
    expect(resolveGoalInsight({ funds: [], lastShown: null, today })).toBeNull()
  })

  it("goal ưu tiên trước emergency (cùng thứ tự resolveActiveGoalFund)", () => {
    const emergency = fund({
      id: "f0",
      name: "Khẩn cấp",
      fund_type: "emergency",
      current_balance: 90_000_000,
    })
    const goal = fund({ id: "f2", name: "Mua nhà", current_balance: 90_000_000 })
    const d = resolveGoalInsight({ funds: [emergency, goal], lastShown: null, today })
    expect(d!.params.goalName).toBe("Mua nhà")
  })
})
