import { z } from "zod"

// Quỹ khẩn cấp: target/months để null — tự tính "3 × chi tiêu tháng" sau khi có thu nhập (story 4.3/4.4)
export const goalSchema = z
  .object({
    presetId: z.enum(["emergency", "education", "house", "travel", "custom"]),
    fundType: z.enum(["emergency", "goal"]),
    name: z.string().min(1, "Tên mục tiêu không được để trống"),
    targetAmount: z.number().positive("Số đích phải lớn hơn 0").nullable(),
    targetMonths: z.number().int("Thời hạn phải là số tháng nguyên").positive("Thời hạn phải lớn hơn 0").nullable(),
  })
  .refine((g) => g.fundType === "emergency" || (g.targetAmount !== null && g.targetMonths !== null), {
    message: "Mục tiêu cần số đích và thời hạn",
  })

export type OnboardingGoal = z.infer<typeof goalSchema>
