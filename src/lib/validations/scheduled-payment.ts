import { z } from "zod"

export const scheduledPaymentCreateSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  period: z.enum(["monthly", "quarterly", "yearly"]),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  payment_method: z.string().optional().nullable(),
  next_due_date: z.string().min(1, "Ngày đến hạn không được để trống"),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const scheduledPaymentUpdateSchema = scheduledPaymentCreateSchema.extend({
  id: z.string().uuid(),
  status: z.enum(["active", "cancelled", "expired"]),
})

export const markPaidFormSchema = z
  .object({
    create_transaction: z.boolean(),
    account_id: z.string().uuid().optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    member_id: z.string().uuid().optional().nullable(),
    date: z.string().optional(),
  })
  .refine(
    (d) => !d.create_transaction || (d.account_id && d.category_id),
    {
      message: "Cần chọn tài khoản và danh mục khi tạo giao dịch",
      path: ["account_id"],
    }
  )

export type ScheduledPaymentCreateInput = z.infer<typeof scheduledPaymentCreateSchema>
export type ScheduledPaymentUpdateInput = z.infer<typeof scheduledPaymentUpdateSchema>
export type MarkPaidFormInput = z.infer<typeof markPaidFormSchema>
