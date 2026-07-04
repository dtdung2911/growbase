"use client"

import { buildInsightDescriptor } from "@/lib/insight/selectState"
import { resolveActiveGoalFund } from "@/lib/insight/resolveActiveGoalFund"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { DashboardData } from "@/types/app"

type DailyInsightBannerProps = {
  data: DashboardData
}

export function DailyInsightBanner({ data }: DailyInsightBannerProps) {
  const { t } = useTranslation()

  const descriptor = buildInsightDescriptor({
    budgetLines: data.budgetLines,
    yesterdayTransactions: data.yesterdayTransactions,
    hasAnyTransactionEver: data.hasAnyTransactionEver,
    activeGoalFund: resolveActiveGoalFund(data.funds),
  })

  return (
    <div className="rounded-[18px] border border-border/40 bg-card p-5 shadow-card">
      <p className="text-sm">{t(descriptor.i18nKey, descriptor.params)}</p>
    </div>
  )
}
