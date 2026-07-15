import { z } from "zod"

export const updateHouseholdSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  currency: z.enum(["VND", "USD"]).optional(),
})

export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>
