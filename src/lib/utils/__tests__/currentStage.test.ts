import { describe, it, expect } from "vitest"
import { currentStage } from "@/lib/utils/currentStage"

describe("currentStage", () => {
  const target = 90_000_000

  it("GĐ1 khi số dư dưới 1/3 target", () => {
    expect(currentStage(0, target)).toBe(1)
    expect(currentStage(target / 3 - 1, target)).toBe(1)
  })

  it("GĐ2 khi số dư từ 1/3 target đến dưới target", () => {
    expect(currentStage(target / 3, target)).toBe(2)
    expect(currentStage(target - 1, target)).toBe(2)
  })

  it("GĐ3 khi số dư đạt hoặc vượt target", () => {
    expect(currentStage(target, target)).toBe(3)
    expect(currentStage(target * 2, target)).toBe(3)
  })

  it("target không dương → GĐ1 (chưa có kế hoạch)", () => {
    expect(currentStage(0, 0)).toBe(1)
    expect(currentStage(100, -5)).toBe(1)
  })
})
