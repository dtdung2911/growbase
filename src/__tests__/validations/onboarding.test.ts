import { describe, expect, it } from "vitest"
import {
  budgetSetupSchema,
  completeOnboardingSchema,
  debtSchema,
  incomeSourceSchema,
} from "@/lib/validations/onboarding"

const UUID = "11111111-1111-1111-1111-111111111111"

// --- fixtures hợp lệ tối thiểu ---
const validIncome = { sourceName: "Lương", monthlyAmount: 5_000_000 }
const validAccount = {
  name: "Vietcombank",
  accountType: "bank" as const,
  isCreditCard: false,
}
const validDebt = {
  creditorName: "Ngân hàng X",
  debtType: "bank_loan" as const,
  totalAmount: 100_000_000,
  monthlyPayment: 4_200_000,
}
const validBudget = (pct: number) => ({
  name: "Test line",
  budgetPct: pct,
  linkedCategoryGroupNames: [],
})

describe("incomeSourceSchema", () => {
  it("chấp nhận data hợp lệ", () => {
    expect(incomeSourceSchema.safeParse(validIncome).success).toBe(true)
  })

  it("chấp nhận memberId là uuid hoặc null/undefined", () => {
    expect(
      incomeSourceSchema.safeParse({ ...validIncome, memberId: UUID }).success
    ).toBe(true)
    expect(
      incomeSourceSchema.safeParse({ ...validIncome, memberId: null }).success
    ).toBe(true)
  })

  it("reject monthlyAmount = 0 (phải > 0)", () => {
    expect(
      incomeSourceSchema.safeParse({ ...validIncome, monthlyAmount: 0 }).success
    ).toBe(false)
  })

  it("reject monthlyAmount âm", () => {
    expect(
      incomeSourceSchema.safeParse({ ...validIncome, monthlyAmount: -1 }).success
    ).toBe(false)
  })

  it("reject sourceName rỗng", () => {
    expect(
      incomeSourceSchema.safeParse({ ...validIncome, sourceName: "" }).success
    ).toBe(false)
  })
})

describe("debtSchema", () => {
  it("chấp nhận debt hợp lệ", () => {
    expect(debtSchema.safeParse(validDebt).success).toBe(true)
  })

  it.each(["bank_loan", "credit_card", "mortgage", "personal"])(
    "chấp nhận debtType hợp lệ: %s",
    (debtType) => {
      expect(
        debtSchema.safeParse({ ...validDebt, debtType }).success
      ).toBe(true)
    }
  )

  it("reject debtType không hợp lệ ('other')", () => {
    expect(
      debtSchema.safeParse({ ...validDebt, debtType: "other" }).success
    ).toBe(false)
  })

  it("reject monthlyPayment = 0 (phải > 0)", () => {
    expect(
      debtSchema.safeParse({ ...validDebt, monthlyPayment: 0 }).success
    ).toBe(false)
  })

  it("reject creditorName rỗng", () => {
    expect(
      debtSchema.safeParse({ ...validDebt, creditorName: "" }).success
    ).toBe(false)
  })

  // M3 KHÔNG apply (fixer skip): totalAmount vẫn nonnegative() → 0 hợp lệ.
  // Đây là behavior hiện tại — wizard không có UI cho totalAmount, draft luôn = 0.
  it("chấp nhận totalAmount = 0 (M3 không apply, nonnegative)", () => {
    expect(
      debtSchema.safeParse({ ...validDebt, totalAmount: 0 }).success
    ).toBe(true)
  })

  it("reject totalAmount âm", () => {
    expect(
      debtSchema.safeParse({ ...validDebt, totalAmount: -1 }).success
    ).toBe(false)
  })
})

describe("budgetSetupSchema (per-line)", () => {
  it("chấp nhận pct trong [0,100]", () => {
    expect(budgetSetupSchema.safeParse(validBudget(50)).success).toBe(true)
    expect(budgetSetupSchema.safeParse(validBudget(0)).success).toBe(true)
    expect(budgetSetupSchema.safeParse(validBudget(100)).success).toBe(true)
  })

  it("reject pct > 100", () => {
    expect(budgetSetupSchema.safeParse(validBudget(101)).success).toBe(false)
  })

  it("reject pct âm", () => {
    expect(budgetSetupSchema.safeParse(validBudget(-1)).success).toBe(false)
  })

  it("default linkedCategoryGroupNames = []", () => {
    const r = budgetSetupSchema.safeParse({ name: "x", budgetPct: 10 })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.linkedCategoryGroupNames).toEqual([])
  })
})

describe("completeOnboardingSchema — refine tổng budget <= 100", () => {
  const base = {
    householdId: UUID,
    incomes: [validIncome],
    accounts: [validAccount],
    debts: [],
  }

  it("pass khi tổng budget = 100", () => {
    const r = completeOnboardingSchema.safeParse({
      ...base,
      budgetPcts: [validBudget(60), validBudget(40)],
    })
    expect(r.success).toBe(true)
  })

  it("pass khi tổng budget = 0 (user reset hết về 0)", () => {
    const r = completeOnboardingSchema.safeParse({
      ...base,
      budgetPcts: [validBudget(0), validBudget(0)],
    })
    expect(r.success).toBe(true)
  })

  it("fail khi tổng budget > 100 với message đúng", () => {
    const r = completeOnboardingSchema.safeParse({
      ...base,
      budgetPcts: [validBudget(60), validBudget(50)],
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("Tổng ngân sách vượt 100%")
      expect(r.error.issues[0].path).toEqual(["budgetPcts"])
    }
  })
})

describe("completeOnboardingSchema — required collections", () => {
  const budgetPcts = [validBudget(100)]

  it("fail khi incomes = []", () => {
    const r = completeOnboardingSchema.safeParse({
      householdId: UUID,
      incomes: [],
      accounts: [validAccount],
      debts: [],
      budgetPcts,
    })
    expect(r.success).toBe(false)
  })

  it("fail khi accounts = []", () => {
    const r = completeOnboardingSchema.safeParse({
      householdId: UUID,
      incomes: [validIncome],
      accounts: [],
      debts: [],
      budgetPcts,
    })
    expect(r.success).toBe(false)
  })

  it("pass khi debts = [] (optional, có default)", () => {
    const r = completeOnboardingSchema.safeParse({
      householdId: UUID,
      incomes: [validIncome],
      accounts: [validAccount],
      budgetPcts,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.debts).toEqual([])
  })

  it("fail khi householdId không phải uuid", () => {
    const r = completeOnboardingSchema.safeParse({
      householdId: "not-a-uuid",
      incomes: [validIncome],
      accounts: [validAccount],
      debts: [],
      budgetPcts,
    })
    expect(r.success).toBe(false)
  })
})
