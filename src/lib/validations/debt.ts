import { z } from "zod"

export const createDebtSchema = z.object({
  creditor_name: z.string().min(1, "Tên chủ nợ không được để trống"),
  debt_type: z.enum(["bank_loan", "credit_card", "mortgage", "personal"]),
  total_amount: z.number().positive("Tổng nợ phải lớn hơn 0"),
  remaining_amount: z.number().nonnegative().optional(),
  monthly_payment: z.number().positive("Trả hàng tháng phải lớn hơn 0"),
  interest_rate: z.number().min(0).max(100).optional(),
  start_date: z.string().optional(),
  expected_end_date: z.string().optional(),
  member_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export const updateDebtSchema = createDebtSchema.partial()

export const paidOffDebtSchema = z.object({
  id: z.string().uuid(),
})

export type CreateDebtInput = z.infer<typeof createDebtSchema>
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>
export type PaidOffDebtInput = z.infer<typeof paidOffDebtSchema>
