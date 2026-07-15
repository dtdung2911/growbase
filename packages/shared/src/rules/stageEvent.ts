import type { AllocationPlan } from "../constants/budgetTemplate"

export type StageTransition = {
  direction: "up" | "down"
  from: 1 | 2 | 3
  to: 1 | 2 | 3
}

// So GĐ đã lưu (per-device) với GĐ hiện tại → sự kiện lên/xuống. lastSeen null = lần đầu (baseline):
// chưa có gì để so → không kể sự kiện, caller chỉ ghi GĐ hiện tại (BR-OB-018 không notify chéo member).
export function detectStageTransition(
  lastSeen: 1 | 2 | 3 | null,
  current: 1 | 2 | 3,
): StageTransition | null {
  if (lastSeen === null || lastSeen === current) return null
  return { direction: current > lastSeen ? "up" : "down", from: lastSeen, to: current }
}

// "Còn N tháng là đầy lại" (BR-OB-018) cho sự kiện TỤT: N = tháng để emergency về ngưỡng GĐ vừa tụt.
// thiếu = ngưỡng − balance; rate = capacity tháng × share GĐ hiện tại. Share mirror fundPlan
// suggestedContribution:96 — GĐ1 100%, GĐ2 70% NHƯNG hết goal dở thì emergency nhận 100%.
// Ngưỡng đầy lại = đáy của GĐ cao vừa rời: về GĐ2 cần lại target đầy, về GĐ1 cần lại target/3.
// rate ≤ 0 → null: caller bỏ số, câu vẫn tích cực (không bịa timeline).
export function monthsToRefill({
  toStage,
  emergencyBalance,
  emergencyTarget,
  capacityThisMonth,
  hasIncompleteGoals,
}: {
  toStage: 1 | 2
  emergencyBalance: number
  emergencyTarget: number
  capacityThisMonth: number
  hasIncompleteGoals: boolean
}): number | null {
  const threshold = toStage === 2 ? emergencyTarget : emergencyTarget / 3
  const share = toStage === 1 || !hasIncompleteGoals ? 1 : 0.7
  const rate = capacityThisMonth * share
  const gap = threshold - emergencyBalance
  if (gap <= 0) return 0
  if (rate <= 0) return null
  return Math.ceil(gap / rate)
}

// Còn quỹ chưa đạt? timelineMonths 0 = đã đầy sẵn; null / >0 = còn dở (emergency + goals).
export function hasUnmetFund(plan: AllocationPlan): boolean {
  return plan.allocations.some((a) => a.timelineMonths !== 0)
}

// Drift = tháng TRƯỚC (lịch thực) không có fund_contribution nào VÀ còn quỹ chưa đạt (BR-OB-017):
// tháng không góp là hợp lệ — timeline tự giãn, kể tử tế, KHÔNG phải lỗi.
export function shouldShowDrift({
  contributedLastMonth,
  unmetFund,
}: {
  contributedLastMonth: boolean
  unmetFund: boolean
}): boolean {
  return !contributedLastMonth && unmetFund
}
