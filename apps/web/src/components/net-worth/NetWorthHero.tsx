"use client"

import { Icon } from "@iconify/react"
import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { cn } from "@/lib/utils/cn"

type NetWorthHeroProps = {
  total: number
  delta: number | null
  updatedAt: string | null
}

export function NetWorthHero({ total, delta, updatedAt }: NetWorthHeroProps) {
  const { t } = useTranslation()

  const hasDelta = delta !== null && delta !== 0
  const isUp = (delta ?? 0) > 0

  return (
    <div className="flex flex-col items-center gap-2 rounded-[13px] border border-border/40 bg-card p-6 text-center shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("netWorth.heroTitle")}
      </p>
      <p className="font-mono text-3xl font-bold tabular-nums text-ink md:text-4xl">
        {formatVND(total)}
      </p>

      {hasDelta && (
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-semibold",
            isUp ? "text-success" : "text-destructive"
          )}
        >
          <Icon
            icon={isUp ? "lucide:trending-up" : "lucide:trending-down"}
            className="h-4 w-4"
          />
          <span className="font-mono tabular-nums">
            {isUp ? "+" : ""}
            {formatVND(delta ?? 0)}
          </span>
          <span className="font-normal text-muted-foreground">
            {t("netWorth.changeFromLast")}
          </span>
        </div>
      )}

      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          {t("netWorth.updatedAt", { date: updatedAt })}
        </p>
      )}
    </div>
  )
}
