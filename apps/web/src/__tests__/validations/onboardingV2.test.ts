import { describe, expect, it } from "vitest"
import { completeOnboardingV2Schema, goalSchema, monthlyIncomeSchema } from "@growbase/shared/schemas/onboardingV2"
import { CUSTOM_ICON_CHOICES, PRESET_ICON_NAMES } from "@/components/onboarding/v2/goalPresetIcons"

const validGoal = {
  presetId: "education" as const,
  fundType: "goal" as const,
  name: "Quỹ học cho con",
  targetAmount: 200_000_000,
}

describe("goalSchema", () => {
  it("chấp nhận goal preset hợp lệ", () => {
    expect(goalSchema.safeParse(validGoal).success).toBe(true)
  })

  it("chấp nhận emergency với target null (tự tính sau)", () => {
    const result = goalSchema.safeParse({
      presetId: "emergency",
      fundType: "emergency",
      name: "Quỹ khẩn cấp",
      targetAmount: null,
    })
    expect(result.success).toBe(true)
  })

  it("từ chối goal thường thiếu targetAmount", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: null }).success).toBe(false)
  })

  it("từ chối targetAmount 0 hoặc âm", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: 0 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: -1000 }).success).toBe(false)
  })

  it("từ chối targetAmount dưới 100.000đ hoặc số lẻ; chấp nhận đúng 100.000", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: 1 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: 99_999 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: 100_000.5 }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: 100_000 }).success).toBe(true)
  })

  it("từ chối targetAmount vượt trần numeric(15,0)", () => {
    expect(goalSchema.safeParse({ ...validGoal, targetAmount: 100_000_000_000_001 }).success).toBe(false)
  })

  it("từ chối name rỗng hoặc chỉ khoảng trắng", () => {
    expect(goalSchema.safeParse({ ...validGoal, name: "" }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, name: "   " }).success).toBe(false)
  })

  it("từ chối presetId/fundType ngoài enum", () => {
    expect(goalSchema.safeParse({ ...validGoal, presetId: "yacht" }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, fundType: "freedom" }).success).toBe(false)
  })

  it("chấp nhận icon trong whitelist", () => {
    expect(goalSchema.safeParse({ ...validGoal, icon: CUSTOM_ICON_CHOICES[0] }).success).toBe(true)
    expect(goalSchema.safeParse({ ...validGoal, icon: PRESET_ICON_NAMES.education }).success).toBe(true)
  })

  it("từ chối icon string tự do ngoài whitelist", () => {
    expect(goalSchema.safeParse({ ...validGoal, icon: "ph:skull-duotone" }).success).toBe(false)
    expect(goalSchema.safeParse({ ...validGoal, icon: "definitely-not-an-icon" }).success).toBe(false)
  })

  it("mặc định icon fallback (pencil) khi bỏ trống", () => {
    const result = goalSchema.safeParse(validGoal)
    expect(result.success).toBe(true)
    expect(result.success && result.data.icon).toBe(PRESET_ICON_NAMES.custom)
  })
})

describe("monthlyIncomeSchema", () => {
  it("chấp nhận số ≥ 100.000", () => {
    expect(monthlyIncomeSchema.safeParse(20_000_000).success).toBe(true)
    expect(monthlyIncomeSchema.safeParse(100_000).success).toBe(true)
  })

  it("từ chối dưới ngưỡng tối thiểu (nhầm đơn vị)", () => {
    expect(monthlyIncomeSchema.safeParse(20).success).toBe(false)
    expect(monthlyIncomeSchema.safeParse(99_999).success).toBe(false)
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
    }
    const result = completeOnboardingV2Schema.safeParse({ goals: [emergencyGoal], monthlyIncome: 20_000_000 })
    expect(result.success).toBe(false)
  })

  it("rejects presetId emergency đội lốt fundType goal (bypass UI)", () => {
    const pseudoEmergency = { ...validGoal, presetId: "emergency" as const }
    const result = completeOnboardingV2Schema.safeParse({ goals: [pseudoEmergency], monthlyIncome: 20_000_000 })
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

  it("rejects income below minimum", () => {
    expect(completeOnboardingV2Schema.safeParse({ goals: [validGoal], monthlyIncome: 20 }).success).toBe(false)
  })

  it("rejects a goal with targetAmount overflowing numeric(15,0)", () => {
    expect(
      completeOnboardingV2Schema.safeParse({
        goals: [{ ...validGoal, targetAmount: 100_000_000_000_001 }],
        monthlyIncome: 20_000_000,
      }).success,
    ).toBe(false)
  })

  it("rejects duplicate preset goals", () => {
    expect(
      completeOnboardingV2Schema.safeParse({
        goals: [validGoal, { ...validGoal }],
        monthlyIncome: 20_000_000,
      }).success,
    ).toBe(false)
  })

  it("rejects duplicate custom goals by name", () => {
    const custom = { presetId: "custom" as const, fundType: "goal" as const, name: "Xe máy", targetAmount: 30_000_000 }
    expect(
      completeOnboardingV2Schema.safeParse({
        goals: [custom, { ...custom }],
        monthlyIncome: 20_000_000,
      }).success,
    ).toBe(false)
  })

  it("accepts distinct custom goals with different names", () => {
    const a = { presetId: "custom" as const, fundType: "goal" as const, name: "Xe máy", targetAmount: 30_000_000 }
    const b = { presetId: "custom" as const, fundType: "goal" as const, name: "Laptop", targetAmount: 25_000_000 }
    expect(
      completeOnboardingV2Schema.safeParse({ goals: [a, b], monthlyIncome: 20_000_000 }).success,
    ).toBe(true)
  })

  it("rejects a goal with whitespace-only name", () => {
    expect(
      completeOnboardingV2Schema.safeParse({
        goals: [{ ...validGoal, name: "   " }],
        monthlyIncome: 20_000_000,
      }).success,
    ).toBe(false)
  })

  it("rejects a goal with targetAmount 0", () => {
    const result = completeOnboardingV2Schema.safeParse({
      goals: [{ ...validGoal, targetAmount: 0 }],
      monthlyIncome: 20_000_000,
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing goals or monthlyIncome", () => {
    expect(completeOnboardingV2Schema.safeParse({ monthlyIncome: 20_000_000 }).success).toBe(false)
    expect(completeOnboardingV2Schema.safeParse({ goals: [validGoal] }).success).toBe(false)
  })
})
