import { z } from "zod"

export const createEstimatedExpenseSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  category_id: z.string().uuid().optional(),
  linked_fund_id: z.string().uuid().optional(),
  estimated_amount: z.number().positive("Số tiền phải lớn hơn 0"),
  target_date: z.string().optional(),
  notes: z.string().optional(),
})

export const updateEstimatedExpenseSchema = z.object({
  name: z.string().min(1).optional(),
  estimated_amount: z.number().positive().optional(),
  actual_amount: z.number().nonnegative().nullable().optional(),
  status: z.enum(["planned", "completed", "cancelled"]).optional(),
  target_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateEstimatedExpenseInput = z.infer<
  typeof createEstimatedExpenseSchema
>
export type UpdateEstimatedExpenseInput = z.infer<
  typeof updateEstimatedExpenseSchema
>
