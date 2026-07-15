import { z } from "zod"

export const createCategoryGroupSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  cost_type_id: z.string().uuid(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const updateCategoryGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
})

export type CreateCategoryGroupInput = z.infer<typeof createCategoryGroupSchema>
export type UpdateCategoryGroupInput = z.infer<typeof updateCategoryGroupSchema>
