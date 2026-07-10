import { describe, expect, it } from "vitest"
import {
  detectStageTransition,
  hasUnmetFund,
  monthsToRefill,
  shouldShowDrift,
} from "@/lib/insight/stageEvent"
import type { AllocationPlan } from "@/lib/constants/budgetTemplate"

describe("detectStageTransition", () => {
  it("baseline (lastSeen null) → không sự kiện", () => {
    expect(detectStageTransition(null, 1)).toBeNull()
    expect(detectStageTransition(null, 3)).toBeNull()
  })

  it("không đổi → null", () => {
    expect(detectStageTransition(2, 2)).toBeNull()
  })

  it("1→2 lên", () => {
    expect(detectStageTransition(1, 2)).toEqual({ direction: "up", from: 1, to: 2 })
  })

  it("2→3 lên", () => {
    expect(detectStageTransition(2, 3)).toEqual({ direction: "up", from: 2, to: 3 })
  })

  it("2→1 xuống", () => {
    expect(detectStageTransition(2, 1)).toEqual({ direction: "down", from: 2, to: 1 })
  })

  it("3→2 xuống (rút tụt ngưỡng)", () => {
    expect(detectStageTransition(3, 2)).toEqual({ direction: "down", from: 3, to: 2 })
  })

  it("3→1 xuống nhiều bậc", () => {
    expect(detectStageTransition(3, 1)).toEqual({ direction: "down", from: 3, to: 1 })
  })
})

describe("monthsToRefill", () => {
  it("về GĐ2 (rời GĐ3) còn goal dở: đầy lại = target đầy, share 70%", () => {
    // thiếu = 30tr − 24tr = 6tr; rate = 3tr × 0.7 = 2.1tr → ceil(6/2.1) = 3
    expect(
      monthsToRefill({
        toStage: 2,
        emergencyBalance: 24_000_000,
        emergencyTarget: 30_000_000,
        capacityThisMonth: 3_000_000,
        hasIncompleteGoals: true,
      }),
    ).toBe(3)
  })

  it("về GĐ2 nhưng HẾT goal dở: emergency nhận 100% (mirror fundPlan)", () => {
    // thiếu = 6tr; rate = 3tr × 1 = 3tr → ceil(6/3) = 2 (nhanh hơn nhánh 70%)
    expect(
      monthsToRefill({
        toStage: 2,
        emergencyBalance: 24_000_000,
        emergencyTarget: 30_000_000,
        capacityThisMonth: 3_000_000,
        hasIncompleteGoals: false,
      }),
    ).toBe(2)
  })

  it("về GĐ1 (rời GĐ2): đầy lại = target/3, share 100% bất kể goal", () => {
    // ngưỡng = 30tr/3 = 10tr; thiếu = 10tr − 4tr = 6tr; rate = 3tr → ceil(6/3) = 2
    expect(
      monthsToRefill({
        toStage: 1,
        emergencyBalance: 4_000_000,
        emergencyTarget: 30_000_000,
        capacityThisMonth: 3_000_000,
        hasIncompleteGoals: true,
      }),
    ).toBe(2)
  })

  it("rate 0 (không capacity) → null, câu vẫn tích cực", () => {
    expect(
      monthsToRefill({
        toStage: 2,
        emergencyBalance: 24_000_000,
        emergencyTarget: 30_000_000,
        capacityThisMonth: 0,
        hasIncompleteGoals: true,
      }),
    ).toBeNull()
  })

  it("đã ở trên ngưỡng (gap ≤ 0) → 0", () => {
    expect(
      monthsToRefill({
        toStage: 1,
        emergencyBalance: 20_000_000,
        emergencyTarget: 30_000_000,
        capacityThisMonth: 3_000_000,
        hasIncompleteGoals: false,
      }),
    ).toBe(0)
  })
})

function plan(timelines: (number | null)[]): AllocationPlan {
  return {
    capacityMonthly: 0,
    emergencyTarget: 0,
    stage1EndMonth: null,
    stage2EndMonth: null,
    allocations: timelines.map((timelineMonths, i) => ({
      id: i === 0 ? "emergency" : `g${i}`,
      monthlyAmount: null,
      timelineMonths,
    })),
  }
}

describe("hasUnmetFund", () => {
  it("tất cả timeline 0 (đầy) → false", () => {
    expect(hasUnmetFund(plan([0, 0]))).toBe(false)
  })

  it("có quỹ timeline >0 → true", () => {
    expect(hasUnmetFund(plan([0, 5]))).toBe(true)
  })

  it("có quỹ timeline null (không bao giờ xong) → true", () => {
    expect(hasUnmetFund(plan([null]))).toBe(true)
  })
})

describe("shouldShowDrift", () => {
  it("không góp tháng trước + còn quỹ dở → hiện", () => {
    expect(shouldShowDrift({ contributedLastMonth: false, unmetFund: true })).toBe(true)
  })

  it("đã góp tháng trước → không hiện", () => {
    expect(shouldShowDrift({ contributedLastMonth: true, unmetFund: true })).toBe(false)
  })

  it("mọi quỹ đã đạt → không hiện dù chưa góp", () => {
    expect(shouldShowDrift({ contributedLastMonth: false, unmetFund: false })).toBe(false)
  })
})
