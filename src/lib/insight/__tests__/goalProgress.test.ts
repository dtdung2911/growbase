import { describe, expect, it } from "vitest"
import {
  GOAL_NOTEWORTHY_MONTHS,
  buildGoalNarrative,
  computeGoalProgress,
  crossedMilestone,
  goalProgressInputFromFund,
  isGoalNoteworthy,
} from "@/lib/insight/goalProgress"
import type { Fund } from "@/types/app"
import en from "@/lib/i18n/messages/en.json"
import vi from "@/lib/i18n/messages/vi.json"

// Goal chuẩn cho tests: 120tr trong 300 ngày (~10 tháng), pace kỳ vọng 12tr/tháng
const base = {
  targetAmount: 120_000_000,
  currentBalance: 0,
  createdAt: "2026-01-01T00:00:00+07:00",
  targetDate: "2026-10-28", // 300 ngày sau 01-01
}

describe("computeGoalProgress", () => {
  it("tính expected line tuyến tính: target × (ngày đã qua / tổng ngày)", () => {
    // 150/300 ngày = 50% kỳ vọng = 60tr; balance 60tr → đúng nhịp
    const p = computeGoalProgress({ ...base, currentBalance: 60_000_000, today: new Date(2026, 4, 31) })
    expect(p).not.toBeNull()
    expect(p!.expectedRatio).toBeCloseTo(0.5)
    expect(p!.expectedAmount).toBeCloseTo(60_000_000)
    expect(p!.actualRatio).toBeCloseTo(0.5)
    expect(p!.deviationMonths).toBeCloseTo(0)
    expect(p!.state).toBe("on-track")
  })

  it("đi trước ≥ ngưỡng tháng → ahead, monthsEarly từ tốc độ góp thực tế", () => {
    // Ngày 150: kỳ vọng 60tr, balance 90tr → deviation +30tr = +2.5 tháng pace 12tr
    const p = computeGoalProgress({ ...base, currentBalance: 90_000_000, today: new Date(2026, 4, 31) })
    expect(p!.state).toBe("ahead")
    expect(p!.deviationMonths).toBeCloseTo(2.5)
    // pace thực = 90tr/150 ngày = 600k/ngày → 120tr cần 200 ngày → sớm 100 ngày ≈ 3 tháng
    expect(p!.monthsEarly).toBe(3)
    expect(p!.catchUpAmount).toBeNull()
  })

  it("tụt lại ≥ ngưỡng tháng → behind, catchUpAmount = số thiếu so với kỳ vọng", () => {
    // Ngày 150: kỳ vọng 60tr, balance 40tr → thiếu 20tr
    const p = computeGoalProgress({ ...base, currentBalance: 40_000_000, today: new Date(2026, 4, 31) })
    expect(p!.state).toBe("behind")
    expect(p!.catchUpAmount).toBeCloseTo(20_000_000)
    expect(p!.monthsEarly).toBeNull()
  })

  it("chênh lệch dưới ngưỡng → on-track (boundary: đúng ngưỡng → không còn on-track)", () => {
    // pace kỳ vọng 12tr/tháng → ngưỡng 1 tháng = 12tr deviation
    const atThreshold = computeGoalProgress({ ...base, currentBalance: 72_000_000, today: new Date(2026, 4, 31) })
    expect(atThreshold!.deviationMonths).toBeCloseTo(GOAL_NOTEWORTHY_MONTHS)
    expect(atThreshold!.state).toBe("ahead")

    const justUnder = computeGoalProgress({ ...base, currentBalance: 71_000_000, today: new Date(2026, 4, 31) })
    expect(justUnder!.state).toBe("on-track")
  })

  it("goal vừa tạo hôm nay (0 ngày đã qua) → expected 0, on-track, không NaN", () => {
    const p = computeGoalProgress({ ...base, today: new Date(2026, 0, 1) })
    expect(p!.expectedRatio).toBe(0)
    expect(p!.expectedAmount).toBe(0)
    expect(p!.deviationMonths).toBeCloseTo(0)
    expect(p!.state).toBe("on-track")
    expect(Number.isNaN(p!.actualRatio)).toBe(false)
  })

  it("goal tạo hôm nay nhưng đã có balance → ahead, monthsEarly không chia 0", () => {
    const p = computeGoalProgress({ ...base, currentBalance: 30_000_000, today: new Date(2026, 0, 1) })
    expect(p!.state).toBe("ahead")
    expect(Number.isFinite(p!.monthsEarly!)).toBe(true)
    expect(p!.monthsEarly!).toBeGreaterThanOrEqual(1)
  })

  it("deadline đã qua + chưa đủ → expectedRatio clamp 1, behind, catchUp = phần còn thiếu", () => {
    const p = computeGoalProgress({ ...base, currentBalance: 80_000_000, today: new Date(2026, 11, 31) })
    expect(p!.expectedRatio).toBe(1)
    expect(p!.state).toBe("behind")
    expect(p!.catchUpAmount).toBeCloseTo(40_000_000)
  })

  it("balance vượt target → luôn ahead, actualRatio > 1 không clamp", () => {
    const p = computeGoalProgress({ ...base, currentBalance: 150_000_000, today: new Date(2026, 4, 31) })
    expect(p!.state).toBe("ahead")
    expect(p!.actualRatio).toBeCloseTo(1.25)
    expect(p!.monthsEarly!).toBeGreaterThanOrEqual(1)
  })

  it("balance = target đúng ngày cuối → ahead (đã về đích), không narrative behind vô nghĩa", () => {
    const p = computeGoalProgress({ ...base, currentBalance: 120_000_000, today: new Date(2026, 9, 28) })
    expect(p!.state).toBe("ahead")
  })

  it("thiếu dữ liệu expected line → null: targetDate null (Quỹ khẩn cấp onboarding)", () => {
    expect(computeGoalProgress({ ...base, targetDate: null })).toBeNull()
  })

  it("thiếu dữ liệu → null: targetAmount null hoặc 0", () => {
    expect(computeGoalProgress({ ...base, targetAmount: null })).toBeNull()
    expect(computeGoalProgress({ ...base, targetAmount: 0 })).toBeNull()
  })

  it("tổng ngày = 0 (deadline trùng ngày tạo) → null, không chia 0", () => {
    expect(computeGoalProgress({ ...base, targetDate: "2026-01-01" })).toBeNull()
  })

  it("date math theo local time — createdAt UTC string vẫn ra đúng ngày GMT+7", () => {
    // 2025-12-31T18:00Z = 2026-01-01 01:00 GMT+7 → ngày tạo local là 01-01
    const p = computeGoalProgress({
      ...base,
      createdAt: "2025-12-31T18:00:00Z",
      currentBalance: 60_000_000,
      today: new Date(2026, 4, 31),
    })
    expect(p!.expectedRatio).toBeCloseTo(0.5)
  })
})

describe("buildGoalNarrative", () => {
  const at = (balance: number) =>
    computeGoalProgress({ ...base, currentBalance: balance, today: new Date(2026, 4, 31) })!

  it("ahead → insight.goalAhead với goalName + monthsEarly (number)", () => {
    const d = buildGoalNarrative(at(90_000_000), "Mua nhà")
    expect(d.i18nKey).toBe("insight.goalAhead")
    expect(d.params).toEqual({ goalName: "Mua nhà", monthsEarly: 3 })
  })

  it("behind → insight.goalBehind với catchUpAmount đã formatVND", () => {
    const d = buildGoalNarrative(at(40_000_000), "Mua nhà")
    expect(d.i18nKey).toBe("insight.goalBehind")
    expect(d.params.goalName).toBe("Mua nhà")
    expect(typeof d.params.catchUpAmount).toBe("string")
    expect(d.params.catchUpAmount).toContain("20.000.000")
  })

  it("on-track → insight.goalOnTrack chỉ cần goalName", () => {
    const d = buildGoalNarrative(at(60_000_000), "Mua nhà")
    expect(d.i18nKey).toBe("insight.goalOnTrack")
    expect(d.params).toEqual({ goalName: "Mua nhà" })
  })

  it("3 template keys tồn tại đủ vi + en, có placeholder khớp params", () => {
    for (const messages of [vi, en] as Record<string, string>[]) {
      expect(messages["insight.goalAhead"]).toContain("{{goalName}}")
      expect(messages["insight.goalAhead"]).toContain("{{monthsEarly}}")
      expect(messages["insight.goalBehind"]).toContain("{{catchUpAmount}}")
      expect(messages["insight.goalOnTrack"]).toContain("{{goalName}}")
    }
  })
})

describe("crossedMilestone", () => {
  it("trả mốc cao nhất vừa vượt — nhảy 5% → 60% trả 50, không xếp hàng nhiều mốc", () => {
    expect(crossedMilestone(0.05, 0.6)).toBe(50)
  })

  it("vượt đúng một mốc", () => {
    expect(crossedMilestone(0.2, 0.3)).toBe(25)
  })

  it("không vượt mốc nào → null", () => {
    expect(crossedMilestone(0.11, 0.2)).toBeNull()
    expect(crossedMilestone(0.5, 0.5)).toBeNull()
  })

  it("chạm 100% → 100", () => {
    expect(crossedMilestone(0.8, 1)).toBe(100)
  })
})

describe("isGoalNoteworthy", () => {
  const today = new Date(2026, 4, 31)
  const ahead = computeGoalProgress({ ...base, currentBalance: 90_000_000, today })!
  const onTrack = computeGoalProgress({ ...base, currentBalance: 60_000_000, today })!

  it("chênh lệch vượt ngưỡng → đáng nói", () => {
    expect(isGoalNoteworthy(ahead, { today })).toBe(true)
  })

  it("on-track → không đáng nói", () => {
    expect(isGoalNoteworthy(onTrack, { today })).toBe(false)
  })

  it("vừa qua milestone → đáng nói kể cả khi on-track", () => {
    expect(isGoalNoteworthy(onTrack, { justCrossedMilestone: true, today })).toBe(true)
  })

  it("anti-repeat: cùng câu đã show hôm qua → im lặng", () => {
    const lastShown = { i18nKey: "insight.goalAhead", dateISO: "2026-05-30" }
    expect(isGoalNoteworthy(ahead, { lastShown, today })).toBe(false)
  })

  it("anti-repeat: cùng câu show 2 ngày trước → nói lại được", () => {
    const lastShown = { i18nKey: "insight.goalAhead", dateISO: "2026-05-29" }
    expect(isGoalNoteworthy(ahead, { lastShown, today })).toBe(true)
  })

  it("câu khác với lần show trước → đáng nói ngay", () => {
    const lastShown = { i18nKey: "insight.goalBehind", dateISO: "2026-05-30" }
    expect(isGoalNoteworthy(ahead, { lastShown, today })).toBe(true)
  })

  it("milestone override anti-repeat", () => {
    const lastShown = { i18nKey: "insight.goalAhead", dateISO: "2026-05-30" }
    expect(isGoalNoteworthy(ahead, { justCrossedMilestone: true, lastShown, today })).toBe(true)
  })
})

describe("goalProgressInputFromFund", () => {
  it("map đúng field từ Fund", () => {
    const fund = {
      target_amount: 120_000_000,
      current_balance: 30_000_000,
      created_at: "2026-01-01T00:00:00+07:00",
      target_date: "2026-10-28",
    } as Fund
    const today = new Date(2026, 4, 31)
    expect(goalProgressInputFromFund(fund, today)).toEqual({
      targetAmount: 120_000_000,
      currentBalance: 30_000_000,
      createdAt: "2026-01-01T00:00:00+07:00",
      targetDate: "2026-10-28",
      today,
    })
  })
})
