"use client"

import { Input } from "@/components/ui/input"
import { Icon } from "@iconify/react"
import type { BudgetBaseline } from "@growbase/shared/types/app"

type SystemBudgetRowProps = {
  baseline: BudgetBaseline
  value: number
  onChange: (pct: number) => void
}

export function SystemBudgetRow({
  baseline,
  value,
  onChange,
}: SystemBudgetRowProps) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-3 px-2 py-2">
      <div className="flex items-center gap-2">
        {baseline.is_auto_calculated ? (
          <Icon icon="lucide:calculator" className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Icon icon="lucide:lock" className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm">{baseline.name}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="h-8 w-20 rounded-xl text-right font-mono text-sm tabular-nums"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  )
}
