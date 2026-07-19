"use client"

import { Icon } from "@iconify/react"
import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"

type NetWorthDiscrepancyBannerProps = {
  totalSystem: number
  totalRecorded: number
  discrepancy: number
}

export function NetWorthDiscrepancyBanner({
  totalSystem,
  totalRecorded,
  discrepancy,
}: NetWorthDiscrepancyBannerProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-warning/20 bg-warning-soft p-4">
      <div className="flex items-center gap-2 text-warning">
        <Icon icon="lucide:triangle-alert" className="h-4 w-4 shrink-0" />
        <p className="text-sm font-semibold">
          {t("netWorth.discrepancy")}: {formatVND(discrepancy)}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">{t("netWorth.systemTotal")}</p>
          <p className="font-mono text-xs font-medium tabular-nums">{formatVND(totalSystem)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("netWorth.recordedTotal")}</p>
          <p className="font-mono text-xs font-medium tabular-nums">{formatVND(totalRecorded)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("netWorth.discrepancyTotal")}</p>
          <p className="font-mono text-xs font-medium tabular-nums text-warning">
            {formatVND(discrepancy)}
          </p>
        </div>
      </div>
    </div>
  )
}
