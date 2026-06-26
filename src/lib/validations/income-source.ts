import { z } from "zod"

export const createIncomeSourceSchema = z.object({
  source_name: z.string().min(1, "Tên nguồn thu không được để trống"),
  monthly_amount: z.number().positive("Thu nhập phải lớn hơn 0"),
  member_id: z.string().uuid().optional(),
})

export const updateIncomeSourceSchema = z.object({
  monthly_amount: z.number().positive("Thu nhập phải lớn hơn 0"),
})

export type CreateIncomeSourceInput = z.infer<typeof createIncomeSourceSchema>
export type UpdateIncomeSourceInput = z.infer<typeof updateIncomeSourceSchema>
