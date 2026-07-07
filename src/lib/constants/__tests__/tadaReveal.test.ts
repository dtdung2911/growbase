import { describe, it, expect } from "vitest"
import { TADA_REVEAL_STAGES } from "@/lib/constants/tadaReveal"

describe("TADA_REVEAL_STAGES", () => {
  it("có đúng 4 stage theo thứ tự reveal", () => {
    expect(TADA_REVEAL_STAGES).toEqual(["budget", "goal", "feasibility", "todayRemaining"])
  })
})
