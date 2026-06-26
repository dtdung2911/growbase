import { z } from "zod"

export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  bank_name: z.string().optional(),
  account_type: z
    .enum(["bank", "cash", "savings", "credit_card", "investment", "precious_metal"])
    .optional(),
  owner_name: z.string().optional(),
  is_credit_card: z.boolean().optional(),
  color: z.string().optional(),
})

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
