import { describe, it, expect } from "vitest"
import { monthRange, toYearMonth, firstDayOfMonth } from "@/lib/utils/date"

describe("monthRange", () => {
  it("returns first and last day of a 31-day month", () => {
    expect(monthRange("2026-01")).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    })
  })

  it("returns first and last day of a 30-day month", () => {
    expect(monthRange("2026-04")).toEqual({
      from: "2026-04-01",
      to: "2026-04-30",
    })
  })

  it("handles February in a non-leap year (28 days)", () => {
    expect(monthRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    })
  })

  it("handles February in a leap year (29 days)", () => {
    expect(monthRange("2024-02")).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    })
  })

  it("handles December (year boundary, end of year)", () => {
    expect(monthRange("2026-12")).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    })
  })

  it("does not bleed into the next month", () => {
    // last day phải thuộc đúng tháng được hỏi
    expect(monthRange("2026-11").to).toBe("2026-11-30")
  })
})

describe("toYearMonth", () => {
  it("formats a given date as YYYY-MM", () => {
    expect(toYearMonth(new Date(2026, 5, 16))).toBe("2026-06") // month 5 = June
  })

  it("zero-pads single-digit months (January)", () => {
    expect(toYearMonth(new Date(2026, 0, 1))).toBe("2026-01")
  })

  it("formats December correctly", () => {
    expect(toYearMonth(new Date(2026, 11, 31))).toBe("2026-12")
  })

  it("defaults to the current month when no arg passed", () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    expect(toYearMonth()).toBe(expected)
  })
})

describe("firstDayOfMonth", () => {
  it("appends -01 to a year-month string", () => {
    expect(firstDayOfMonth("2026-06")).toBe("2026-06-01")
  })

  it("works for the first month of the year", () => {
    expect(firstDayOfMonth("2026-01")).toBe("2026-01-01")
  })

  it("works for the last month of the year", () => {
    expect(firstDayOfMonth("2026-12")).toBe("2026-12-01")
  })

  it("output matches monthRange.from for the same input", () => {
    const ym = "2026-09"
    expect(firstDayOfMonth(ym)).toBe(monthRange(ym).from)
  })
})
