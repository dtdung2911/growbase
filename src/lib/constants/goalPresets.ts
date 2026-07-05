import { addDays, format } from "date-fns"

// Số liệu khớp onboarding GoalStep + PRD V1-FR10.
// GoalStep.tsx đang có WIP riêng — hợp nhất 2 nguồn preset sau khi WIP ổn định.
export const GOAL_PRESETS = [
  { presetId: "education", targetAmount: 200_000_000, targetMonths: 60 },
  { presetId: "house", targetAmount: 500_000_000, targetMonths: 36 },
  { presetId: "travel", targetAmount: 30_000_000, targetMonths: 12 },
] as const

// Cùng công thức months × 30 ngày như /api/onboarding/complete
export function presetTargetDate(targetMonths: number, today = new Date()): string {
  return format(addDays(today, targetMonths * 30), "yyyy-MM-dd")
}
