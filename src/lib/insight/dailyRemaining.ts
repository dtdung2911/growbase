import { BUDGET_TEMPLATE, COST_TYPE_GROUP_LABELS, FLEXIBLE_COST_TYPE_GROUPS } from "@/lib/constants/budgetTemplate"
import type { BudgetActualLine } from "@/types/app"

// Nhận diện dòng "linh hoạt" theo cả tên baseline template lẫn nhãn nhóm vi/en —
// demo Hook (và dữ liệu gộp theo nhóm) dùng nhãn nhóm, dữ liệu thật dùng tên baseline.
const flexibleNames = new Set([
  ...BUDGET_TEMPLATE.filter((tpl) => FLEXIBLE_COST_TYPE_GROUPS.includes(tpl.costTypeGroup)).map(
    (tpl) => tpl.name
  ),
  ...FLEXIBLE_COST_TYPE_GROUPS.flatMap((group) => [
    COST_TYPE_GROUP_LABELS[group].vi,
    COST_TYPE_GROUP_LABELS[group].en,
  ]),
])

export function isFlexibleBudgetLine(line: BudgetActualLine): boolean {
  return flexibleNames.has(line.cost_type_name)
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function calculateDailyRemaining(budgetLines: BudgetActualLine[], today: Date = new Date()): number {
  const flexibleLines = budgetLines.filter(isFlexibleBudgetLine)
  const totalBudget = flexibleLines.reduce((sum, line) => sum + line.budget_amount, 0)
  const totalSpent = flexibleLines.reduce((sum, line) => sum + line.actual_amount, 0)
  const daysRemaining = Math.max(daysInMonth(today) - today.getDate() + 1, 1)
  // Clamp 0: bội chi không được render "còn -350.000 ₫ để chi tiêu"
  return Math.max(0, Math.floor((totalBudget - totalSpent) / daysRemaining))
}
