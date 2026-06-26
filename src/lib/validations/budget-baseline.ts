import { z } from "zod"

export const updateBaselinePctSchema = z.object({
  id: z.string().uuid(),
  budget_pct: z.number().min(0).max(100),
})

export const createCustomBaselineSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  budget_pct: z.number().min(0).max(100),
  linked_category_group_ids: z.array(z.string().uuid()).optional(),
  description: z.string().optional(),
})

export const deleteCustomBaselineSchema = z.object({
  id: z.string().uuid(),
})

export const batchUpdateBaselinesSchema = z
  .object({
    baselines: z.array(
      z.object({
        id: z.string().uuid(),
        budget_pct: z.number().min(0).max(100),
      })
    ),
  })
  .refine(
    (data) => data.baselines.reduce((sum, b) => sum + b.budget_pct, 0) <= 100,
    { message: "Tổng phân bổ không được vượt quá 100%" }
  )

export type UpdateBaselinePctInput = z.infer<typeof updateBaselinePctSchema>
export type CreateCustomBaselineInput = z.infer<
  typeof createCustomBaselineSchema
>
export type DeleteCustomBaselineInput = z.infer<
  typeof deleteCustomBaselineSchema
>
export type BatchUpdateBaselinesInput = z.infer<
  typeof batchUpdateBaselinesSchema
>
