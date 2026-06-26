import { z } from "zod"

export const incomeSourceSchema = z.object({
  sourceName: z.string().min(1, "Tên nguồn không được để trống"),
  monthlyAmount: z.number().positive("Số tiền phải lớn hơn 0"),
  memberId: z.string().uuid().nullable().optional(),
})

export const accountSchema = z.object({
  name: z.string().min(1, "Tên tài khoản không được để trống"),
  bankName: z.string().optional(),
  accountType: z.enum([
    "bank",
    "cash",
    "savings",
    "credit_card",
    "investment",
    "precious_metal",
  ]),
  ownerName: z.string().optional(),
  isCreditCard: z.boolean(),
})

export const debtSchema = z.object({
  creditorName: z.string().min(1, "Tên bên vay không được để trống"),
  debtType: z.enum(["bank_loan", "credit_card", "mortgage", "personal"]),
  totalAmount: z.number().nonnegative(),
  remainingAmount: z.number().nonnegative().optional(),
  monthlyPayment: z.number().positive("Số tiền trả/tháng phải lớn hơn 0"),
  expectedEndDate: z.string().optional(),
  memberId: z.string().uuid().nullable().optional(),
})

export const budgetSetupSchema = z.object({
  name: z.string().min(1),
  budgetPct: z.number().min(0).max(100),
  linkedCategoryGroupNames: z.array(z.string()).default([]),
})

export const completeOnboardingSchema = z
  .object({
    householdId: z.string().uuid(),
    incomes: z.array(incomeSourceSchema).min(1, "Cần ít nhất 1 nguồn thu nhập"),
    accounts: z.array(accountSchema).min(1, "Cần ít nhất 1 tài khoản"),
    debts: z.array(debtSchema).default([]),
    budgetPcts: z.array(budgetSetupSchema),
  })
  .refine(
    (data) =>
      data.budgetPcts.reduce((sum, b) => sum + b.budgetPct, 0) <= 100,
    { message: "Tổng ngân sách vượt 100%", path: ["budgetPcts"] }
  )

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>
