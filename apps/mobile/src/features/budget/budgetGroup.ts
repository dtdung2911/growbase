import { BUDGET_TEMPLATE, type CostTypeGroupKey } from "@growbase/shared/constants/budgetTemplate"
import type { BudgetActualLine } from "@growbase/shared/types/app"

export type BudgetGroupKey = Exclude<CostTypeGroupKey, "income">

export const BUDGET_GROUP_ORDER: BudgetGroupKey[] = [
  "fixed",
  "variable",
  "wasteful",
  "savings_investment",
  "debt_repayment",
  "other",
]

export type BudgetGroup = {
  key: BudgetGroupKey
  lines: BudgetActualLine[]
  budgetAmount: number
  actualAmount: number
  remaining: number
  usagePct: number
}

export type BudgetLineStatus = "safe" | "warning" | "over"

export function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0
  return Math.max(0, Math.min(pct, 100))
}

export function budgetLineStatus(usagePct: number): BudgetLineStatus {
  if (usagePct >= 100) return "over"
  if (usagePct >= 80) return "warning"
  return "safe"
}

export function groupBudgetLines(lines: BudgetActualLine[]): BudgetGroup[] {
  const byName = new Map(lines.map((l) => [l.cost_type_name, l]))
  const buckets = new Map<CostTypeGroupKey, BudgetActualLine[]>()

  for (const tpl of BUDGET_TEMPLATE) {
    const line = byName.get(tpl.name)
    if (!line) continue
    const bucket = buckets.get(tpl.costTypeGroup)
    if (bucket) bucket.push(line)
    else buckets.set(tpl.costTypeGroup, [line])
  }

  return BUDGET_GROUP_ORDER.flatMap((key) => {
    const groupLines = buckets.get(key)
    if (!groupLines) return []
    const budgetAmount = groupLines.reduce((s, l) => s + l.budget_amount, 0)
    const actualAmount = groupLines.reduce((s, l) => s + l.actual_amount, 0)
    return {
      key,
      lines: groupLines,
      budgetAmount,
      actualAmount,
      remaining: budgetAmount - actualAmount,
      usagePct: budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0,
    }
  })
}
