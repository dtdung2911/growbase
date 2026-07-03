import { describe, expect, it } from "vitest"
import { goalSchema } from "@/lib/validations/onboardingV2"

const validGoal = {
  presetId: "education" as const,
  fundType: "goal" as const,
  name: "Quỹ học cho con",
  targetAmount: 200_000_000,
  targetMonths: 60,
}

describe("goalSchema", () => {
  it("chấp nhận goal preset hợp lệ", () => {
    expect(goalSchema.safeParse(validGoal).success).toBe(true)
  })

  it("chấp nhận emergency với target/months null (tự tính sau)", () => {
    const result = goalSchema.safeParse({
      presetId: "emergency",
      fundType: "emergency",
      name: "Quỹ khẩn cấp",
      targetAmount: null,
      targetMonths: null,
    })
    expect(result.success).toBe(true)
  })

  it("từ chối goal thường thiếu targetAmount", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: null }).success).toBe(false)
  })

  it("từ chối goal thường thiếu targetMonths", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetMonths: null }).success).toBe(false)
  })

  it("từ chối targetAmount 0 hoặc âm", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: 0 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: -1000 }).success).toBe(false)
  })

  it("từ chối targetMonths 0, âm, hoặc lẻ", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetMonths: 0 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, targetMonths: -6 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, targetMonths: 12.5 }).success).toBe(false)
  })

  it("từ chối name rỗng", () => {
    expect(goalSchema.safeParse({ ...validGoal, name: "" }).success).toBe(false)
  })

  it("từ chối presetId/fundType ngoài enum", () => {
    expect(goalSchema.safeParse({ ...validGoal, presetId: "yacht" }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, fundType: "freedom" }).success).toBe(false)
  })
})
