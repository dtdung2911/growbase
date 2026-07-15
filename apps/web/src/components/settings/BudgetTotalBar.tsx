"use client"

import { cn } from "@/lib/utils/cn"
import { useTranslation } from "@/lib/i18n/useTranslation"

type BudgetTotalBarProps = {
  total: number
}

export function BudgetTotalBar({ total }: BudgetTotalBarProps) {
  const { t } = useTranslation()
  const isOver = total > 100

  return (
    <div
      className={cn(
        "sticky top-0 z-10 rounded-[13px] border p-3 text-center shadow-card",
        isOver
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-success/20 bg-success-soft text-success"
      )}
    >
      <span className="font-mono text-sm font-semibold tabular-nums">
        {t("settings.budget.total", { value: total.toFixed(1) })}
      </span>
      {isOver && (
        <p className="mt-0.5 text-xs">{t("settings.budget.overWarning")}</p>
      )}
    </div>
  )
}
