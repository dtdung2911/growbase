import { z } from "zod"

const netWorthItemSchema = z.object({
  account_id: z.string().uuid(),
  balance_recorded: z.number(),
})

export const netWorthSnapshotSchema = z.object({
  snapshot_month: z.string().min(1, "Tháng không hợp lệ"),
  items: z.array(netWorthItemSchema).min(1, "Cần ít nhất 1 tài khoản"),
  total_recorded: z.number(),
  total_system: z.number(),
  notes: z.string().optional().nullable(),
})

export type NetWorthSnapshotInput = z.infer<typeof netWorthSnapshotSchema>
