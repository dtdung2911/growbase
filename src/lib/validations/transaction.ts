import { z } from "zod"

export const createTransactionSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  direction: z.enum(["in", "out"]),
  transaction_type: z
    .enum(["income", "expense", "debt_repayment"])
    .default("expense"),
  category_id: z.string().uuid("Danh mục không hợp lệ"),
  account_id: z.string().uuid("Tài khoản không hợp lệ"),
  description: z.string().optional(),
  transaction_date: z.string().default(() => new Date().toISOString().slice(0, 10)),
  is_unusual_income: z.boolean().default(false),
  debt_entry_id: z.string().uuid().optional().nullable(),
})

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().uuid("Giao dịch không hợp lệ"),
})

export const createTransferSchema = z
  .object({
    from_account_id: z.string().uuid("Tài khoản nguồn không hợp lệ"),
    to_account_id: z.string().uuid("Tài khoản đích không hợp lệ"),
    amount: z.number().positive("Số tiền phải lớn hơn 0"),
    description: z.string().optional(),
    transaction_date: z.string().default(() => new Date().toISOString().slice(0, 10)),
    is_credit_card_payment: z.boolean().default(false),
  })
  .refine((d) => d.from_account_id !== d.to_account_id, {
    message: "Tài khoản nguồn và đích phải khác nhau",
    path: ["to_account_id"],
  })

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CreateTransferInput = z.infer<typeof createTransferSchema>
