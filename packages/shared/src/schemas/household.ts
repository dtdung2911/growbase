import { z } from "zod"

export const householdSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  type: z.enum(["personal", "family"]),
  currency: z.enum(["VND", "USD"]),
})

export const inviteSchema = z.object({
  householdId: z.string().uuid("Hộ gia đình không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  display_name: z.string().min(1, "Tên không được để trống"),
  role: z.enum(["member", "viewer"]).default("member"),
})

export type HouseholdInput = z.infer<typeof householdSchema>
export type InviteInput = z.infer<typeof inviteSchema>
