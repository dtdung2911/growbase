export const TADA_REVEAL_STAGES = ["budget", "goal", "feasibility", "todayRemaining"] as const

export type TadaRevealStage = (typeof TADA_REVEAL_STAGES)[number]

export type ThreeStageKey =
  | "withGoals"
  | "emergencyOnly"
  | "noMonthsWithGoals"
  | "noMonthsEmergencyOnly"
  | "readyWithGoals"
  | "readyEmergencyOnly"

// Chọn key kể chuyện 3 giai đoạn theo mốc GĐ1 (stage1EndMonth) + có goal hay không.
// null = quỹ khẩn cấp không đạt nổi 1 tháng an toàn trong cap; 0 = đã đủ ngay từ đầu.
export function pickThreeStageKey(stage1EndMonth: number | null, hasGoals: boolean): ThreeStageKey {
  if (stage1EndMonth === null) return hasGoals ? "noMonthsWithGoals" : "noMonthsEmergencyOnly"
  if (stage1EndMonth === 0) return hasGoals ? "readyWithGoals" : "readyEmergencyOnly"
  return hasGoals ? "withGoals" : "emergencyOnly"
}
