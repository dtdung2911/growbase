"use client"

import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"

type MetricCardProps = {
  label: string
  amount: number
  formatAmount: (n: number) => string
  trend?: "up" | "down" | "neutral"
  trendPct?: number | null
  icon?: string
  variant?: "default" | "income" | "expense" | "primary"
  className?: string
}

export function MetricCard({
  label,
  amount,
  formatAmount,
  trend,
  trendPct,
  icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const isHighlight = variant === "income" || variant === "expense" || variant === "primary"
  const hasTrendPct = trendPct !== null && trendPct !== undefined
  const trendUp = (trendPct ?? 0) >= 0

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[18px] p-4 transition-shadow",
        variant === "default" &&
          "bg-light-primary border border-border/40 shadow-card",
        variant === "income" &&
          "bg-gradient-to-br from-primary to-primary-hover text-white shadow-card",
        variant === "expense" &&
          "bg-gradient-to-br from-primary to-primary-pressed text-white shadow-card",
        variant === "primary" &&
          "bg-gradient-to-br from-[#0084DB] to-[#004F8A] text-white shadow-card",
        className,
      )}
    >
      {/* Decorative blob */}
      {variant === "income" && (
        <img
          src="/images/card-2.png"
          alt=""
          className="pointer-events-none absolute -right-3 -top-1 h-20 w-20 object-contain"
          aria-hidden="true"
        />
      )}
      {variant === "expense" && (
        <img
          src="/images/card-1.png"
          alt=""
          className="pointer-events-none absolute -right-3 -top-1 h-20 w-20 object-contain"
          aria-hidden="true"
        />
      )}
      {variant === "default" && (
        <img
          src="/images/card-3.png"
          alt=""
          className="pointer-events-none absolute -right-3 -top-1 h-20 w-20 object-contain"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          {icon && (
            <div
              className={cn(
                "mb-3 grid h-10 w-10 place-items-center rounded-xl",
                isHighlight ? "bg-white/20" : "bg-light-primary-pressed",
              )}
            >
              <Icon
                icon={icon}
                className={cn(
                  "h-5 w-5",
                  isHighlight ? "text-white" : "text-white",
                )}
              />
            </div>
          )}

          {/* Trend badge */}
          {hasTrendPct && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
                isHighlight
                  ? trendUp
                    ? "bg-white/20 text-white"
                    : "bg-white/20 text-white/80"
                  : trendUp
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
              )}
            >
              <Icon
                icon={trendUp ? "lucide:trending-up" : "lucide:trending-down"}
                className="h-3 w-3"
              />
              {trendUp ? "+" : ""}
              {trendPct}%
            </span>
          )}
        </div>

        <p className="text-xl font-extrabold font-mono tabular-nums tracking-tight">
          {formatAmount(amount)}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <p
            className={cn(
              "text-xs font-semibold tracking-wide",
              isHighlight ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          {trend && trend !== "neutral" && !hasTrendPct && (
            <Icon
              icon={
                trend === "up" ? "lucide:trending-up" : "lucide:trending-down"
              }
              className={cn(
                "h-3.5 w-3.5",
                isHighlight
                  ? "text-white/60"
                  : trend === "up"
                    ? "text-income"
                    : "text-expense",
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
