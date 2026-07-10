import { z } from "zod"

// iconify format "collection:name" — keeps legacy lucide values like "lucide:shield" valid
const iconifyName = z.string().max(120).regex(/^[a-z0-9-]+:[a-z0-9-]+$/)

export const createFundSchema = z.object({
  name: z.string().trim().min(1, "Tên quỹ không được để trống"),
  description: z.string().optional(),
  fund_type: z.enum(["emergency", "sinking", "goal", "investment", "freedom"]),
  icon: iconifyName.optional(),
  color: z.string().optional(),
  monthly_contribution: z.number().nonnegative().optional(),
  contribution_day: z.number().min(1).max(28).optional(),
  target_amount: z.number().nonnegative().optional().nullable(),
  target_date: z.string().optional().nullable(),
  target_months_expense: z.number().int().min(1).max(24).optional().nullable(),
  expected_return_rate: z.number().optional().nullable(),
  priority: z.number().min(1).max(10).optional(),
  per_member: z.boolean().optional(),
  amount_per_member: z.number().nonnegative().optional().nullable(),
})

export const updateFundSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: iconifyName.optional(),
  color: z.string().optional(),
  monthly_contribution: z.number().nonnegative().optional(),
  contribution_day: z.number().min(1).max(28).optional(),
  target_amount: z.number().nonnegative().nullable().optional(),
  target_date: z.string().nullable().optional(),
  target_months_expense: z.number().int().min(1).max(24).nullable().optional(),
  expected_return_rate: z.number().nullable().optional(),
  priority: z.number().min(1).max(10).optional(),
  priority_rank: z.number().int().min(1, "Hạng phải ≥ 1").optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
})

export type CreateFundInput = z.infer<typeof createFundSchema>
export type UpdateFundInput = z.infer<typeof updateFundSchema>

export const fundContributeSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  account_id: z.string().uuid("Tài khoản không hợp lệ"),
  description: z.string().optional(),
  transaction_date: z.string().default(() => new Date().toISOString().slice(0, 10)),
})

export const fundWithdrawSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  account_id: z.string().uuid("Tài khoản không hợp lệ"),
  category_id: z.string().uuid("Danh mục không hợp lệ"),
  description: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập lý do rút quỹ")
    .max(200, "Lý do rút tối đa 200 ký tự"),
  transaction_date: z.string().default(() => new Date().toISOString().slice(0, 10)),
})

export type FundContributeInput = z.infer<typeof fundContributeSchema>
export type FundWithdrawInput = z.infer<typeof fundWithdrawSchema>
