import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  group_id: z.string().uuid(),
  default_behavior_type: z.enum([
    "fixed",
    "variable",
    "wasteful",
    "debt_repayment",
    "savings_investment",
    "loan",
  ]),
  icon: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
