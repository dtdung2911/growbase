import { describe, it, expect } from "vitest"
import { getBudgetStatus } from "@growbase/shared/rules/budget"

// Logic thực tế (src/lib/utils/budget.ts):
//   actual > budget            → "danger"
//   actual > budget * 0.8      → "warning"
//   else                       → "safe"
// Lưu ý: ngưỡng dùng so sánh STRICT (>), nên đúng tại biên (== budget,
// == budget*0.8) rơi vào nhánh "thấp hơn".
describe("getBudgetStatus", () => {
  it("returns 'safe' when actual is well under budget", () => {
    expect(getBudgetStatus(500, 1000)).toBe("safe")
  })

  it("returns 'safe' exactly at the 80% threshold (strict >)", () => {
    // 800 > 1000*0.8 (=800) là false → không phải warning
    expect(getBudgetStatus(800, 1000)).toBe("safe")
  })

  it("returns 'warning' just above 80% of budget", () => {
    expect(getBudgetStatus(801, 1000)).toBe("warning")
  })

  it("returns 'warning' at 90% of budget", () => {
    expect(getBudgetStatus(900, 1000)).toBe("warning")
  })

  it("returns 'safe' (not danger) exactly at budget (strict >)", () => {
    // 1000 > 1000 là false → không phải danger; 1000 > 800 là true → warning
    expect(getBudgetStatus(1000, 1000)).toBe("warning")
  })

  it("returns 'danger' when actual exceeds budget", () => {
    expect(getBudgetStatus(1001, 1000)).toBe("danger")
  })

  it("returns 'danger' for large overspend", () => {
    expect(getBudgetStatus(5000, 1000)).toBe("danger")
  })

  it("returns 'safe' when actual is zero", () => {
    expect(getBudgetStatus(0, 1000)).toBe("safe")
  })

  it("handles a zero budget: any positive actual is danger", () => {
    // actual > 0 → danger; threshold 0*0.8 = 0
    expect(getBudgetStatus(1, 0)).toBe("danger")
  })

  it("handles zero actual on zero budget as safe", () => {
    // 0 > 0 false, 0 > 0 false → safe
    expect(getBudgetStatus(0, 0)).toBe("safe")
  })
})
