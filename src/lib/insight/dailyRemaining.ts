import { BUDGET_TEMPLATE, FLEXIBLE_COST_TYPE_GROUPS } from "@/lib/constants/budgetTemplate"
import type { BudgetActualLine } from "@/types/app"

const templateByName = new Map(BUDGET_TEMPLATE.map((tpl) => [tpl.name, tpl]))

export function isFlexibleBudgetLine(line: BudgetActualLine): boolean {
  const tpl = templateByName.get(line.cost_type_name)
  if (!tpl) return false
  return FLEXIBLE_COST_TYPE_GROUPS.includes(tpl.costTypeGroup)
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function calculateDailyRemaining(budgetLines: BudgetActualLine[], today: Date = new Date()): number {
  const flexibleLines = budgetLines.filter(isFlexibleBudgetLine)
  const totalBudget = flexibleLines.reduce((sum, line) => sum + line.budget_amount, 0)
  const totalSpent = flexibleLines.reduce((sum, line) => sum + line.actual_amount, 0)
  const daysRemaining = Math.max(daysInMonth(today) - today.getDate() + 1, 1)
  return Math.floor((totalBudget - totalSpent) / daysRemaining)
}
