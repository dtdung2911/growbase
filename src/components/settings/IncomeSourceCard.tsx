"use client"

import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { IncomeSource } from "@/types/app"

type IncomeSourceCardProps = {
  source: IncomeSource
  onEdit: () => void
}

export function IncomeSourceCard({ source, onEdit }: IncomeSourceCardProps) {
  const { t, locale } = useTranslation()
  const fromDate = new Date(source.effective_from).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US"
  )

  return (
    <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{source.source_name}</h4>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatVND(source.monthly_amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("settings.income.effectiveFrom", { date: fromDate })}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={onEdit}
        >
          <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
