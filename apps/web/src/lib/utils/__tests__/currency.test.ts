import { describe, it, expect } from "vitest"
import { formatVND } from "@growbase/shared/rules/currency"

// formatVND dùng Intl.NumberFormat("vi-VN") → dấu chấm phân cách hàng nghìn,
// ký hiệu "₫" ở cuối, ngăn cách bằng non-breaking space (U+00A0).
// Để test robust với mọi loại whitespace, ta normalize NBSP → space thường.
const normalize = (s: string) => s.replace(/ /g, " ")

describe("formatVND", () => {
  it("formats a positive number with thousand separators and ₫ suffix", () => {
    expect(normalize(formatVND(1500000))).toBe("1.500.000 ₫")
  })

  it("formats a small positive number", () => {
    expect(normalize(formatVND(1000))).toBe("1.000 ₫")
  })

  it("formats a negative number with leading minus", () => {
    expect(normalize(formatVND(-50000))).toBe("-50.000 ₫")
  })

  it("formats zero", () => {
    expect(normalize(formatVND(0))).toBe("0 ₫")
  })

  it("formats large numbers (billions)", () => {
    expect(normalize(formatVND(1234567890))).toBe("1.234.567.890 ₫")
  })

  it("rounds away fractional digits (maximumFractionDigits 0)", () => {
    // VND không có phần thập phân → làm tròn
    expect(normalize(formatVND(1000.49))).toBe("1.000 ₫")
    expect(normalize(formatVND(1000.5))).toBe("1.001 ₫")
  })

  it("always ends with the đồng symbol", () => {
    expect(formatVND(42).trim().endsWith("₫")).toBe(true)
  })

  it("uses '.' as the grouping separator (not ',')", () => {
    const out = normalize(formatVND(10000))
    expect(out).toContain("10.000")
    expect(out).not.toContain("10,000")
  })
})
