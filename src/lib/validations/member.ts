import { z } from "zod"

export const inviteMemberSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  display_name: z.string().min(1, "Tên không được để trống"),
  role: z.enum(["member", "viewer"]).default("member"),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
