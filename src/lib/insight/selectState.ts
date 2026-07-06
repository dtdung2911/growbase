import { formatVND } from "@/lib/utils/currency"
import type { BehaviorType, BudgetActualLine, Fund, TransactionDirection } from "@/types/app"
import { calculateDailyRemaining, daysInMonth, isFlexibleBudgetLine } from "./dailyRemaining"
import type { InsightDescriptor, InsightState } from "./types"

const FLEXIBLE_BEHAVIOR_TYPES: BehaviorType[] = ["variable", "wasteful"]

type YesterdayTransaction = {
  amount: number
  direction: TransactionDirection
  behavior_type: BehaviorType | null
}

type SelectStateInput = {
  budgetLines: BudgetActualLine[]
  yesterdayTransactions: YesterdayTransaction[]
  hasAnyTransactionEver: boolean
  activeGoalFund: Pick<Fund, "name" | "monthly_contribution"> | null
  today?: Date
}

function averageDailyFlexibleBudget(budgetLines: BudgetActualLine[], today: Date): number {
  const totalFlexibleBudget = budgetLines
    .filter(isFlexibleBudgetLine)
    .reduce((sum, line) => sum + line.budget_amount, 0)
  return totalFlexibleBudget / daysInMonth(today)
}

function yesterdayFlexibleSpent(transactions: YesterdayTransaction[]): number {
  return transactions
    .filter((t) => t.direction === "out" && t.behavior_type && FLEXIBLE_BEHAVIOR_TYPES.includes(t.behavior_type))
    .reduce((sum, t) => sum + t.amount, 0)
}

export function selectState(input: SelectStateInput): InsightState {
  if (!input.hasAnyTransactionEver) return "first-day"
  if (input.yesterdayTransactions.length === 0) return "no-transactions-yesterday"

  const today = input.today ?? new Date()
  const spent = yesterdayFlexibleSpent(input.yesterdayTransactions)
  const plan = averageDailyFlexibleBudget(input.budgetLines, today)
  return spent <= plan ? "under-plan-yesterday" : "over-plan-yesterday"
}

export function buildInsightDescriptor(input: SelectStateInput): InsightDescriptor {
  const state = selectState(input)
  const today = input.today ?? new Date()
  const remainingToday = formatVND(calculateDailyRemaining(input.budgetLines, today))
  const goalName = input.activeGoalFund?.name ?? ""

  if (state === "first-day" || state === "no-transactions-yesterday") {
    return { state, i18nKey: `insight.${state === "first-day" ? "firstDay" : "noTransactionsYesterday"}`, params: { remainingToday } }
  }

  const spent = yesterdayFlexibleSpent(input.yesterdayTransactions)
  const plan = averageDailyFlexibleBudget(input.budgetLines, today)
  const yesterdaySpent = formatVND(spent)
  const yesterdayPlan = formatVND(plan)
  const yesterdayDiff = formatVND(Math.abs(spent - plan))

  // Không có quỹ goal/emergency → dùng copy không nhắc goalName, tránh câu thủng lỗ
  const underPlanKey = input.activeGoalFund ? "underPlanYesterday" : "underPlanYesterdayNoGoal"
  return {
    state,
    i18nKey: `insight.${state === "under-plan-yesterday" ? underPlanKey : "overPlanYesterday"}`,
    params: { remainingToday, yesterdaySpent, yesterdayPlan, yesterdayDiff, goalName },
  }
}
