import { describe, it, expect } from "vitest"
import { TADA_REVEAL_STAGES, pickThreeStageKey } from "@/lib/constants/tadaReveal"

describe("TADA_REVEAL_STAGES", () => {
  it("có đúng 4 stage theo thứ tự reveal", () => {
    expect(TADA_REVEAL_STAGES).toEqual(["budget", "goal", "feasibility", "todayRemaining"])
  })
})

describe("pickThreeStageKey", () => {
  it("stage1End null → nhánh noMonths theo goals", () => {
    expect(pickThreeStageKey(null, true)).toBe("noMonthsWithGoals")
    expect(pickThreeStageKey(null, false)).toBe("noMonthsEmergencyOnly")
  })

  it("stage1End 0 (đủ ngay từ đầu) → nhánh ready theo goals", () => {
    expect(pickThreeStageKey(0, true)).toBe("readyWithGoals")
    expect(pickThreeStageKey(0, false)).toBe("readyEmergencyOnly")
  })

  it("stage1End > 0 → nhánh có số tháng theo goals", () => {
    expect(pickThreeStageKey(6, true)).toBe("withGoals")
    expect(pickThreeStageKey(6, false)).toBe("emergencyOnly")
  })
})
