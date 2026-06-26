"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { BudgetProgressBar } from "@/components/shared/BudgetProgressBar"
import { BudgetOverrideInput } from "@/components/budget/BudgetOverrideInput"
import { BUDGET_TEMPLATE } from "@/lib/constants/budgetTemplate"
import type { BudgetActualLine } from "@/types/app"

type BudgetGroupRowProps = {
  line: BudgetActualLine
}

export function BudgetGroupRow({ line }: BudgetGroupRowProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const goalText = BUDGET_TEMPLATE.find((tpl) => tpl.name === line.cost_type_name)?.goalText

  return (
    <div className="rounded-[15px] border border-border bg-card shadow-panel">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left min-h-[44px]"
      >
        <Icon
          icon="lucide:chevron-right"
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{line.cost_type_name}</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(line.usage_pct ?? 0)}%
            </span>
          </div>
          <BudgetProgressBar percentage={line.usage_pct ?? 0} className="mt-1.5" />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">{formatVND(line.actual_amount)}</span>
            <span className="font-mono tabular-nums">{formatVND(line.budget_amount)}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-2">
          {goalText && (
            <p className="text-xs text-muted-foreground italic">{goalText}</p>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t("budget.allocation")}: {line.effective_pct}%
              {line.override_pct !== null && (
                <span className="ml-1 text-primary">({t("budget.adjusted")})</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1 text-primary hover:text-primary/80 min-h-[44px] min-w-[44px] justify-center"
            >
              <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
            </button>
          </div>

          {editing && (
            <BudgetOverrideInput
              costTypeId={line.cost_type_id}
              currentPct={line.effective_pct}
              hasOverride={line.override_pct !== null}
              onDone={() => setEditing(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
