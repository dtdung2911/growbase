import {
  buildGoalNarrative,
  computeGoalProgress,
  goalProgressInputFromFund,
  isGoalNoteworthy,
} from "./goalProgress"
import type { GoalNarrativeDescriptor, LastShownNarrative } from "./goalProgress"
import type { Fund } from "@/types/app"

type ResolveGoalInsightInput = {
  funds: Fund[]
  lastShown: LastShownNarrative | null
  today?: Date
}

// Câu goal cho daily insight — null nghĩa là giữ câu mặc định.
// Thứ tự chọn fund y hệt resolveActiveGoalFund (goal → emergency); hàm đó trả Pick nên không dùng lại được.
export function resolveGoalInsight(input: ResolveGoalInsightInput): GoalNarrativeDescriptor | null {
  const fund =
    input.funds.find((f) => f.fund_type === "goal") ??
    input.funds.find((f) => f.fund_type === "emergency") ??
    null
  if (!fund) return null

  const progress = computeGoalProgress(goalProgressInputFromFund(fund, input.today))
  if (!progress) return null
  if (!isGoalNoteworthy(progress, { lastShown: input.lastShown, today: input.today })) return null

  return buildGoalNarrative(progress, fund.name)
}
