"use client"

import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { IncomeSource } from "@growbase/shared/types/app"

type IncomeHistoryItemProps = {
  source: IncomeSource
}

export function IncomeHistoryItem({ source }: IncomeHistoryItemProps) {
  const { locale } = useTranslation()
  const dateFmt = locale === "vi" ? "vi-VN" : "en-US"
  const fromDate = new Date(source.effective_from).toLocaleDateString(dateFmt)
  const toDate = source.effective_to
    ? new Date(source.effective_to).toLocaleDateString(dateFmt)
    : "—"

  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">{source.source_name}</p>
        <p className="text-xs text-muted-foreground">
          {fromDate} — {toDate}
        </p>
      </div>
      <p className="font-mono text-sm tabular-nums text-muted-foreground">
        {formatVND(source.monthly_amount)}
      </p>
    </div>
  )
}
