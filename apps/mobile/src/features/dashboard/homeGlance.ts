import { calculateDailyRemaining, isFlexibleBudgetLine } from "@growbase/shared/rules/dailyRemaining"
import { toYearMonth } from "@growbase/shared/rules/date"
import type { BudgetActualLine } from "@growbase/shared/types/app"

export type DailyAllowance = { amount: number; overspent: boolean }

// null = không áp dụng (không có flexible budget, hoặc đang xem tháng khác tháng hiện tại) → ẩn card
export function getDailyAllowance(
  budgetLines: BudgetActualLine[],
  currentMonth: string,
  today = new Date(),
): DailyAllowance | null {
  if (toYearMonth(today) !== currentMonth) return null

  const flexible = budgetLines.filter(isFlexibleBudgetLine)
  const totalBudget = flexible.reduce((sum, line) => sum + line.budget_amount, 0)
  if (totalBudget <= 0) return null

  const totalSpent = flexible.reduce((sum, line) => sum + line.actual_amount, 0)
  return {
    amount: calculateDailyRemaining(budgetLines, today),
    overspent: totalSpent > totalBudget,
  }
}

// usagePct null khi tổng budget = 0 → chỉ hiện tổng chi, không %
export function getBudgetUsage(
  totalExpense: number,
  budgetLines: BudgetActualLine[],
): { totalBudget: number; usagePct: number | null; over: boolean } {
  const totalBudget = budgetLines.reduce((sum, line) => sum + line.budget_amount, 0)
  const usagePct = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : null
  return { totalBudget, usagePct, over: totalExpense > totalBudget }
}
