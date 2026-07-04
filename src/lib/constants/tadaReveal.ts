export const TADA_REVEAL_STAGES = ["budget", "goal", "feasibility", "todayRemaining"] as const

export type TadaRevealStage = (typeof TADA_REVEAL_STAGES)[number]

// Emergency fund không lưu "months" tuỳ chỉnh ở DB (target_months_expense là hằng số khác) —
// đổi thời hạn ở nhánh infeasible chỉ ảnh hưởng phép tính hiển thị, không persist.
export function resolveFeasibilityMonths(
  fundType: "emergency" | "goal",
  currentMonths: number,
  targetMonths: number
): number {
  return fundType === "goal" ? targetMonths : currentMonths
}
