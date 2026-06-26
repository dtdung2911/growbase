"use client"

import { Badge } from "@/components/ui/badge"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { BudgetBaseline } from "@/types/app"

type CustomBudgetRowProps = {
  baseline: BudgetBaseline
  value: number
  onChange: (pct: number) => void
  onEdit: () => void
  onDelete: () => void
}

export function CustomBudgetRow({
  baseline,
  value,
  onChange,
  onEdit,
  onDelete,
}: CustomBudgetRowProps) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-2 px-2 py-2">
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm">{baseline.name}</span>
        {baseline.linked_category_group_ids.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {baseline.linked_category_group_ids.map((gid) => (
              <Badge
                key={gid}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                {gid.slice(0, 8)}
              </Badge>
            ))}
          </div>
        )}
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

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Icon icon="lucide:trash-2" className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
