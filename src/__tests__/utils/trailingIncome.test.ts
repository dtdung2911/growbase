import { describe, it, expect } from "vitest"
import { trailingHouseholdIncome } from "@/lib/utils/trailingIncome"

const FALLBACK = 12_000_000

describe("trailingHouseholdIncome (BR-OB-015)", () => {
  it("AC3: [40tr, 0, 20tr] → trailing 20tr (sum / số tháng cửa sổ)", () => {
    expect(trailingHouseholdIncome([40_000_000, 0, 20_000_000], FALLBACK)).toBe(20_000_000)
  })

  it("AC3: 0 income mọi tháng → fallback (income onboarding)", () => {
    expect(trailingHouseholdIncome([0, 0, 0], FALLBACK)).toBe(FALLBACK)
  })

  it("thu nhập đều → giữ nguyên", () => {
    expect(trailingHouseholdIncome([30_000_000, 30_000_000, 30_000_000], FALLBACK)).toBe(30_000_000)
  })

  it("một tháng có thu nhập → KHÔNG fallback, vẫn chia cho cả cửa sổ", () => {
    expect(trailingHouseholdIncome([0, 0, 30_000_000], FALLBACK)).toBe(10_000_000)
  })

  it("làm tròn về số nguyên (VND)", () => {
    expect(trailingHouseholdIncome([10_000_000, 0, 0], FALLBACK)).toBe(3_333_333)
  })

  it("mảng rỗng → fallback", () => {
    expect(trailingHouseholdIncome([], FALLBACK)).toBe(FALLBACK)
  })
})
