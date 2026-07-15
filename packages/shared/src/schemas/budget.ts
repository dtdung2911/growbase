import { z } from "zod"

export const budgetOverrideSchema = z.object({
  budget_baseline_id: z.string().uuid("Budget baseline không hợp lệ"),
  month: z.string().min(1, "Tháng không hợp lệ"),
  override_pct: z.number().min(0, "Phần trăm phải >= 0").max(100, "Phần trăm phải <= 100"),
})

export const budgetOverrideDeleteSchema = z.object({
  budget_baseline_id: z.string().uuid("Budget baseline không hợp lệ"),
  month: z.string().min(1, "Tháng không hợp lệ"),
})

export type BudgetOverrideInput = z.infer<typeof budgetOverrideSchema>
export type BudgetOverrideDeleteInput = z.infer<typeof budgetOverrideDeleteSchema>
