"use client"

import { Icon } from "@iconify/react"
import { useLivingPlan } from "@/lib/hooks/useLivingPlan"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import { currentStage } from "@growbase/shared/rules/currentStage"
import { ladderWeights, sumBudgetPct } from "@growbase/shared/constants/budgetTemplate"
import { cn } from "@/lib/utils/cn"
import type { Fund } from "@growbase/shared/types/app"

type FundsPlanStripProps = {
  goalFunds: Fund[] // active goal funds đã sort theo hạng (index 0 = hạng 1)
}

export function FundsPlanStrip({ goalFunds }: FundsPlanStripProps) {
  const { t } = useTranslation()
  const { plan, capacityThisMonth, emergencyBalance, isLoading, isError } = useLivingPlan()

  if (isError)
    return (
      <div className="rounded-[13px] border border-border/40 bg-card p-4 text-sm text-muted-foreground shadow-card">
        {t("funds.plan.loadError")}
      </div>
    )
  if (isLoading || !plan) return <StripSkeleton />

  const savingsPct = sumBudgetPct(["savings_investment"])
  const stage = currentStage(emergencyBalance, plan.emergencyTarget)
  const shieldPct =
    plan.emergencyTarget > 0
      ? Math.min(100, Math.round((emergencyBalance / plan.emergencyTarget) * 100))
      : 0

  const hasGoals = goalFunds.length > 0
  const ladder = ladderWeights(goalFunds.length)
    .map((w) => Math.round(w * 100))
    .join("/")

  return (
    <div className={cn("grid gap-3", hasGoals ? "md:grid-cols-3" : "md:grid-cols-2")}>
      <StripCard icon="solar:wallet-money-linear" label={t("funds.plan.capacityLabel")}>
        <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">
          {formatVND(capacityThisMonth)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("funds.plan.capacityCaption", { pct: savingsPct })}
        </p>
      </StripCard>

      <StripCard icon="solar:shield-check-linear" label={t("funds.plan.stageLabel")}>
        <p className="mt-1 text-sm font-medium text-foreground">{t(`funds.plan.stage${stage}`)}</p>
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                s <= stage ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("funds.plan.shield")}{" "}
          <span className="font-mono tabular-nums text-foreground">{shieldPct}%</span>
        </p>
      </StripCard>

      {hasGoals && (
        <StripCard icon="solar:ranking-linear" label={t("funds.plan.ladderLabel")}>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">{ladder}</p>
          <p className="truncate text-xs text-muted-foreground">
            {t("funds.plan.ladderTop", { name: goalFunds[0].name })}
          </p>
        </StripCard>
      )}
    </div>
  )
}

function StripCard({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon icon={icon} className="text-lg" aria-hidden />
        <span className="text-xs">{label}</span>
      </div>
      {children}
    </div>
  )
}

function StripSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[92px] animate-pulse rounded-[13px] border border-border/40 bg-card shadow-card"
        />
      ))}
    </div>
  )
}
