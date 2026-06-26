import { z } from "zod"

export const createHoldingSchema = z.object({
  stock_code: z.string().min(1, "Mã cổ phiếu không được để trống"),
  weight_pct: z.number().min(0).max(100),
  total_invested: z.number().nonnegative(),
  current_value: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
})

export const updateHoldingSchema = createHoldingSchema.partial().extend({
  current_value: z.number().nonnegative().optional(),
})

export const createDcaPlanSchema = z.object({
  stock_code: z.string().min(1, "Mã cổ phiếu không được để trống"),
  target_allocation_pct: z.number().min(0).max(100),
})

export const createPurchaseSchema = z.object({
  holding_id: z.string().uuid(),
  purchase_month: z.string().min(1, "Tháng mua không được để trống"),
  budget: z.number().nonnegative(),
  price: z.number().positive("Giá phải lớn hơn 0"),
  fees: z.number().nonnegative(),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  amount: z.number().nonnegative(),
  end_value: z.number().nonnegative(),
  monthly_return: z.number(),
  notes: z.string().optional().nullable(),
})

export const updatePurchaseSchema = createPurchaseSchema.partial()

export type CreateHoldingInput = z.infer<typeof createHoldingSchema>
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>
export type CreateDcaPlanInput = z.infer<typeof createDcaPlanSchema>
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>
