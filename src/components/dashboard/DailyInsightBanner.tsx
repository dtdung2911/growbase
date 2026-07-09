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
import ConfettiDuotoneIcon from "@iconify-react/ph/confetti-duotone";

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
  today?: Date
}

export function DailyInsightBanner({ data, today }: DailyInsightBannerProps) {
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
      today,
    })

  return (
    <div className="rounded-[18px] border border-primary/30 bg-primary-soft p-5 ">
      <p className="text-sm text-primary">
        <ConfettiDuotoneIcon
          height="2em"
          style={{
            display: "inline-block",
            verticalAlign: "middle",
            marginRight: "1em",
          }}
        />
        {t(descriptor.i18nKey, descriptor.params)}
      </p>
    </div>
  );
}
