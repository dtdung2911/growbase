import { z } from "zod"
import { ICON_CATALOG, PRESET_ICON_NAMES } from "@/lib/constants/fundIcons"

// Quỹ khẩn cấp: target/months để null — tự tính "3 × chi tiêu tháng" sau khi có thu nhập (story 4.3/4.4)
export const goalSchema = z
  .object({
    presetId: z.enum(["emergency", "education", "house", "travel", "custom"]),
    fundType: z.enum(["emergency", "goal"]),
    name: z.string().trim().min(1, "Tên mục tiêu không được để trống"),
    targetAmount: z
      .number()
      .positive("Số đích phải lớn hơn 0")
      .max(100_000_000_000_000, "Số đích quá lớn")
      .nullable(),
    targetMonths: z
      .number()
      .int("Thời hạn phải là số tháng nguyên")
      .positive("Thời hạn phải lớn hơn 0")
      .max(600, "Thời hạn tối đa 600 tháng")
      .nullable(),
    // Whitelist icon — không nhận string tự do; thiếu → fallback pencil
    icon: z.enum(ICON_CATALOG).default(PRESET_ICON_NAMES.custom),
  })
  .refine((g) => g.fundType === "emergency" || (g.targetAmount !== null && g.targetMonths !== null), {
    message: "Mục tiêu cần số đích và thời hạn",
  })

export type OnboardingGoal = z.infer<typeof goalSchema>

// min(100_000): chặn nhầm đơn vị (nhập "20" nghĩa là 20 triệu)
export const monthlyIncomeSchema = z
  .number({ invalid_type_error: "Bạn hãy nhập thu nhập của cả nhà nhé" })
  .min(100_000, "Thu nhập tối thiểu 100.000đ — nhập đủ số tiền theo đồng nhé")

const goalKey = (g: OnboardingGoal) => (g.presetId === "custom" ? `custom:${g.name}` : g.presetId)

// goals = chỉ mục tiêu thêm; quỹ khẩn cấp là implicit, server luôn prepend (không nằm trong mảng này)
export const completeOnboardingV2Schema = z.object({
  goals: z
    .array(goalSchema)
    .max(5)
    .refine((gs) => gs.every((g) => g.fundType === "goal"), {
      message: "Mục tiêu thêm phải là quỹ mục tiêu",
    })
    // presetId "emergency" với fundType "goal" lọt qua check trên → chặn pseudo-emergency (shield icon) qua API
    .refine((gs) => gs.every((g) => g.presetId !== "emergency"), {
      message: "Không thể chọn quỹ khẩn cấp làm mục tiêu thêm",
    })
    .refine((gs) => new Set(gs.map(goalKey)).size === gs.length, {
      message: "Không thể chọn trùng mục tiêu",
    }),
  monthlyIncome: monthlyIncomeSchema,
  locale: z.enum(["vi", "en"]).default("vi"),
})

export type CompleteOnboardingV2Input = z.infer<typeof completeOnboardingV2Schema>
