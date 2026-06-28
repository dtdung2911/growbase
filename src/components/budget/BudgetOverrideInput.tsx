"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { useBudgetOverrideMutation, useDeleteBudgetOverride } from "@/lib/hooks/useBudget"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { firstDayOfMonth } from "@/lib/utils/date"

type BudgetOverrideInputProps = {
  costTypeId: string
  currentPct: number
  hasOverride: boolean
  onDone: () => void
}

export function BudgetOverrideInput({
  costTypeId,
  currentPct,
  hasOverride,
  onDone,
}: BudgetOverrideInputProps) {
  const [value, setValue] = useState(String(currentPct))
  const month = useAppStore((s) => s.currentMonth)
  const { t } = useTranslation()
  const override = useBudgetOverrideMutation()
  const deleteOverride = useDeleteBudgetOverride()

  const handleSave = () => {
    const pct = Number(value)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    override.mutate(
      {
        budget_baseline_id: costTypeId,
        month: firstDayOfMonth(month),
        override_pct: pct,
      },
      { onSuccess: onDone }
    )
  }

  const handleReset = () => {
    deleteOverride.mutate(
      {
        budget_baseline_id: costTypeId,
        month: firstDayOfMonth(month),
      },
      { onSuccess: onDone }
    )
  }

  const isPending = override.isPending || deleteOverride.isPending

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 rounded-xl border border-border bg-inset px-2 py-1.5 text-base font-mono tabular-nums min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        disabled={isPending}
      />
      <span className="text-sm text-muted-foreground">%</span>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-primary hover:bg-elevated disabled:opacity-50"
        aria-label={t("common.save")}
      >
        <Icon icon="lucide:check" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDone}
        disabled={isPending}
        className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:bg-elevated disabled:opacity-50"
        aria-label={t("common.cancel")}
      >
        <Icon icon="lucide:x" className="h-4 w-4" />
      </button>
      {hasOverride && (
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:bg-elevated disabled:opacity-50"
          aria-label={t("budget.resetOverride")}
        >
          <Icon icon="lucide:rotate-ccw" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
