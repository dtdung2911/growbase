// GĐ lá chắn từ số dư emergency vs target (BR-OB-009): ngưỡng GĐ2 = 1/3 target (1 tháng chi thiết yếu).
export function currentStage(emergencyBalance: number, emergencyTarget: number): 1 | 2 | 3 {
  if (emergencyTarget <= 0) return 1
  if (emergencyBalance >= emergencyTarget) return 3
  if (emergencyBalance >= emergencyTarget / 3) return 2
  return 1
}
