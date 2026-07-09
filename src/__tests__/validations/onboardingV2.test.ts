import { describe, expect, it } from "vitest"
import { completeOnboardingV2Schema, goalSchema, monthlyIncomeSchema } from "@/lib/validations/onboardingV2"

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

describe("monthlyIncomeSchema", () => {
  it("chấp nhận số dương", () => {
    expect(monthlyIncomeSchema.safeParse(20_000_000).success).toBe(true)
    expect(monthlyIncomeSchema.safeParse(1).success).toBe(true)
  })

  it("từ chối 0 và số âm", () => {
    expect(monthlyIncomeSchema.safeParse(0).success).toBe(false)
    expect(monthlyIncomeSchema.safeParse(-5_000_000).success).toBe(false)
  })

  it("từ chối null/undefined/không phải số", () => {
    expect(monthlyIncomeSchema.safeParse(null).success).toBe(false)
    expect(monthlyIncomeSchema.safeParse(undefined).success).toBe(false)
    expect(monthlyIncomeSchema.safeParse("20000000").success).toBe(false)
  })
})

describe("completeOnboardingV2Schema", () => {
  it("accepts goals array + monthlyIncome payload", () => {
    const result = completeOnboardingV2Schema.safeParse({ goals: [validGoal], monthlyIncome: 20_000_000 })
    expect(result.success).toBe(true)
  })

  it("accepts empty goals (chỉ quỹ khẩn cấp implicit)", () => {
    const result = completeOnboardingV2Schema.safeParse({ goals: [], monthlyIncome: 20_000_000 })
    expect(result.success).toBe(true)
  })

  it("rejects emergency fund inside goals array (emergency là implicit server-side)", () => {
    const emergencyGoal = {
      presetId: "emergency",
      fundType: "emergency",
      name: "Quỹ khẩn cấp",
      targetAmount: null,
      targetMonths: null,
    }
    const result = completeOnboardingV2Schema.safeParse({ goals: [emergencyGoal], monthlyIncome: 20_000_000 })
    expect(result.success).toBe(false)
  })

  it("rejects more than 5 goals", () => {
    const goals = Array.from({ length: 6 }, () => validGoal)
    expect(completeOnboardingV2Schema.safeParse({ goals, monthlyIncome: 20_000_000 }).success).toBe(false)
  })

  it("rejects income 0 or negative", () => {
    expect(completeOnboardingV2Schema.safeParse({ goals: [validGoal], monthlyIncome: 0 }).success).toBe(false)
    expect(completeOnboardingV2Schema.safeParse({ goals: [validGoal], monthlyIncome: -1 }).success).toBe(false)
  })

  it("rejects a goal with targetAmount 0", () => {
    const result = completeOnboardingV2Schema.safeParse({
      goals: [{ ...validGoal, targetAmount: 0 }],
      monthlyIncome: 20_000_000,
    })
    expect(result.success).toBe(false)
  })

  it("rejects a goal with non-integer targetMonths", () => {
    const result = completeOnboardingV2Schema.safeParse({
      goals: [{ ...validGoal, targetMonths: 5.5 }],
      monthlyIncome: 20_000_000,
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing goals or monthlyIncome", () => {
    expect(completeOnboardingV2Schema.safeParse({ monthlyIncome: 20_000_000 }).success).toBe(false)
    expect(completeOnboardingV2Schema.safeParse({ goals: [validGoal] }).success).toBe(false)
  })
})
