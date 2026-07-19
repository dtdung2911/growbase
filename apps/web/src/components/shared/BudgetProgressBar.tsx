"use client"

import { cn } from "@/lib/utils/cn"

type BudgetProgressBarProps = {
  percentage: number
  className?: string
}

export function BudgetProgressBar({ percentage, className }: BudgetProgressBarProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100)

  const fillColor =
    percentage > 90
      ? "bg-expense"
      : percentage > 70
        ? "bg-warning"
        : "bg-primary"

  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-inset dark:bg-elevated", className)}
    >
      <div
        className={cn("h-full origin-left rounded-full animate-growth-bar motion-reduce:animate-none", fillColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
