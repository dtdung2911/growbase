"use client"

import { useTranslation } from "@/lib/i18n/useTranslation"
import { buildGoalNarrative } from "@growbase/shared/rules/goalProgress"
import type { GoalProgress } from "@growbase/shared/rules/goalProgress"
import { FUND_TYPE_CONFIG } from "@growbase/shared/types/app"
import type { Fund } from "@growbase/shared/types/app"

type GoalDualProgressProps = {
  fund: Fund
  progress: GoalProgress
}

export function GoalDualProgress({ fund, progress }: GoalDualProgressProps) {
  const { t } = useTranslation()
  const actualColor = fund.color || FUND_TYPE_CONFIG[fund.fund_type].color
  const narrative = progress.state !== "on-track" ? buildGoalNarrative(progress, fund.name) : null

  const bars = [
    { label: t("funds.goalActual"), ratio: progress.actualRatio, style: { backgroundColor: actualColor } },
    { label: t("funds.goalExpected"), ratio: progress.expectedRatio, className: "bg-primary/30" },
  ]

  return (
    <div className="mt-2 space-y-1.5">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[11px] text-muted-foreground">{bar.label}</span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full [transition:width_300ms_ease] ${bar.className ?? ""}`}
              style={{ width: `${Math.min(bar.ratio * 100, 100)}%`, ...bar.style }}
            />
          </div>
          <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
            {Math.round(bar.ratio * 100)}%
          </span>
        </div>
      ))}
      {narrative && (
        <p className="text-xs text-muted-foreground">{t(narrative.i18nKey, narrative.params)}</p>
      )}
    </div>
  )
}
