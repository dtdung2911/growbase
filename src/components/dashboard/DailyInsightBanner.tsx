"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { buildInsightDescriptor } from "@/lib/insight/selectState"
import { resolveActiveGoalFund } from "@/lib/insight/resolveActiveGoalFund"
import { resolveGoalInsight } from "@/lib/insight/goalInsight"
import type { GoalNarrativeDescriptor, LastShownNarrative } from "@/lib/insight/goalProgress"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { DashboardData } from "@/types/app"

function readLastShown(key: string): LastShownNarrative | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as LastShownNarrative) : null
  } catch {
    return null
  }
}

type DailyInsightBannerProps = {
  data: DashboardData
}

export function DailyInsightBanner({ data }: DailyInsightBannerProps) {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  // Câu goal chỉ xuất hiện sau mount: server + first paint luôn là câu mặc định (tránh hydration mismatch)
  const [goalDescriptor, setGoalDescriptor] = useState<GoalNarrativeDescriptor | null>(null)

  // Key theo householdId (AD-3) — switch household không dính lastShown của nhà cũ
  const storageKey = `growbase.goal-narrative-shown.${householdId}`

  useEffect(() => {
    if (!householdId) return
    const descriptor = resolveGoalInsight({ funds: data.funds, lastShown: readLastShown(storageKey) })
    if (!descriptor) return
    setGoalDescriptor(descriptor)
    try {
      const lastShown: LastShownNarrative = { i18nKey: descriptor.i18nKey, dateISO: format(new Date(), "yyyy-MM-dd") }
      localStorage.setItem(storageKey, JSON.stringify(lastShown))
    } catch {
      // private mode — bỏ qua, mai lại đáng nói tiếp cũng không sao
    }
  }, [data.funds, storageKey])

  const descriptor =
    goalDescriptor ??
    buildInsightDescriptor({
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
