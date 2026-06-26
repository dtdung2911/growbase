"use client"

import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"

type MetricCardProps = {
  label: string
  amount: number
  formatAmount: (n: number) => string
  trend?: "up" | "down" | "neutral"
  icon?: string
  variant?: "default" | "income" | "expense"
  className?: string
}

export function MetricCard({
  label,
  amount,
  formatAmount,
  trend,
  icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const isHighlight = variant === "income" || variant === "expense"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 transition-shadow",
        variant === "default" && "bg-card border border-border shadow-panel",
        variant === "income" && "bg-gradient-to-br from-[#0084DB] to-[#006BB8] text-white",
        variant === "expense" && "bg-gradient-to-br from-[#0084DB] to-[#004F8A] text-white",
        className
      )}
    >
      {/* Decorative blob at top-right corner */}
      {variant === "income" && (
        <img src="/images/card-2.png" alt="" className="absolute -top-1 -right-3 h-20 w-20 object-contain pointer-events-none" aria-hidden="true" />
      )}
      {variant === "expense" && (
        <img src="/images/card-1.png" alt="" className="absolute -top-1 -right-3 h-20 w-20 object-contain pointer-events-none" aria-hidden="true" />
      )}

      <div className="relative z-10">
        {/* Icon */}
        {icon && (
          <div
            className={cn(
              "mb-3 grid h-10 w-10 place-items-center rounded-xl",
              isHighlight ? "bg-white/20" : "bg-primary-soft"
            )}
          >
            <Icon
              icon={icon}
              className={cn(
                "h-5 w-5",
                isHighlight ? "text-white" : "text-primary"
              )}
            />
          </div>
        )}

        {/* Amount + trend */}
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-extrabold font-mono tabular-nums tracking-tight">
            {formatAmount(amount)}
          </p>
          {trend && trend !== "neutral" && (
            <span
              className={cn(
                "text-xs font-bold",
                isHighlight
                  ? "text-white/80"
                  : trend === "up"
                    ? "text-income"
                    : "text-expense"
              )}
            >
              <Icon
                icon={trend === "up" ? "lucide:trending-up" : "lucide:trending-down"}
                className="inline h-3.5 w-3.5"
              />
            </span>
          )}
        </div>

        {/* Label */}
        <p
          className={cn(
            "mt-1 text-xs font-semibold tracking-wide",
            isHighlight ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
