import { describe, it, expect } from "vitest"
import { parseDate, parseAmount } from "@/lib/utils/csv"

describe("parseDate", () => {
  it("returns date-only when no time is present", () => {
    expect(parseDate("22/07/2026")).toBe("2026-07-22")
    expect(parseDate("2026-07-22")).toBe("2026-07-22")
    expect(parseDate("2026/07/22")).toBe("2026-07-22")
  })

  it("keeps the time as a VN-offset ISO datetime (d/m/Y H:i)", () => {
    expect(parseDate("22/07/2026 14:30")).toBe("2026-07-22T14:30:00+07:00")
  })

  it("captures seconds when present", () => {
    expect(parseDate("22/07/2026 14:30:45")).toBe("2026-07-22T14:30:45+07:00")
  })

  it("parses time for ISO date input too", () => {
    expect(parseDate("2026-07-22 09:05")).toBe("2026-07-22T09:05:00+07:00")
  })

  it("pads single-digit hours", () => {
    expect(parseDate("22/07/2026 9:05")).toBe("2026-07-22T09:05:00+07:00")
  })

  it("returns null for unparseable input", () => {
    expect(parseDate("not a date")).toBeNull()
  })
})

describe("parseAmount", () => {
  it("handles VN/EU grouping (dot thousands)", () => {
    expect(parseAmount("1.000.000")).toBe(1000000)
  })

  it("handles US grouping (comma thousands)", () => {
    expect(parseAmount("1,000,000")).toBe(1000000)
  })

  it("handles decimal comma (EU)", () => {
    expect(parseAmount("142.560,00")).toBe(142560)
  })

  it("handles decimal dot (US)", () => {
    expect(parseAmount("142,560.50")).toBe(142560.5)
  })
})
