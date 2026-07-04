import { describe, it, expect } from "vitest"
import { TADA_REVEAL_STAGES, resolveFeasibilityMonths } from "@/lib/constants/tadaReveal"
import { EMERGENCY_FUND_TIMELINE_MONTHS } from "@/lib/constants/budgetTemplate"

describe("TADA_REVEAL_STAGES", () => {
  it("có đúng 4 stage theo thứ tự reveal", () => {
    expect(TADA_REVEAL_STAGES).toEqual(["budget", "goal", "feasibility", "todayRemaining"])
  })
})

describe("resolveFeasibilityMonths", () => {
  it("fundType goal → dùng targetMonths", () => {
    expect(resolveFeasibilityMonths("goal", 99, 6)).toBe(6)
  })

  it("fundType emergency → dùng currentMonths (override local, không persist)", () => {
    expect(resolveFeasibilityMonths("emergency", 18, 6)).toBe(18)
  })

  it("fundType emergency, currentMonths mặc định = EMERGENCY_FUND_TIMELINE_MONTHS", () => {
    expect(resolveFeasibilityMonths("emergency", EMERGENCY_FUND_TIMELINE_MONTHS, 6)).toBe(
      EMERGENCY_FUND_TIMELINE_MONTHS
    )
  })
})
