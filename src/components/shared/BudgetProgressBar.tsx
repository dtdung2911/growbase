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
      className={cn("h-1.5 overflow-hidden rounded-full bg-[#e7f0f8] dark:bg-elevated", className)}
    >
      <div
        className={cn("h-full origin-left rounded-full", fillColor)}
        style={{
          width: `${clamped}%`,
          animation: "fillProgress 1.1s ease",
        }}
      />
    </div>
  )
}
