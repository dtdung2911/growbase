import { z } from "zod"

export const COST_TYPE_CODES = [
  "fixed",
  "variable",
  "wasteful",
  "debt_repayment",
  "savings_investment",
  "income",
  "loan",
] as const

export const createCostTypeSchema = z.object({
  display_name: z.string().min(1, "Tên không được để trống"),
  display_name_vi: z.string().min(1, "Tên không được để trống"),
  code: z.enum(COST_TYPE_CODES),
})

export const updateCostTypeSchema = z.object({
  display_name: z.string().min(1).optional(),
  display_name_vi: z.string().min(1).optional(),
  sort_order: z.number().optional(),
})

export type CreateCostTypeInput = z.infer<typeof createCostTypeSchema>
export type UpdateCostTypeInput = z.infer<typeof updateCostTypeSchema>
export type CostTypeCode = (typeof COST_TYPE_CODES)[number]
