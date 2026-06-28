"use client"

import Link from "next/link"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVNDCompact } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { FUND_TYPE_CONFIG } from "@/types/app"
import type { Fund } from "@/types/app"

type FundOverviewCardProps = {
  fund: Fund
}

export function FundOverviewCard({ fund }: FundOverviewCardProps) {
  const { t } = useTranslation()
  const config = FUND_TYPE_CONFIG[fund.fund_type]
  const color = fund.color || config.color

  const target = fund.target_amount
  const progress =
    target && target > 0
      ? Math.min((fund.current_balance / target) * 100, 100)
      : null

  const isUrgent =
    fund.fund_type === "emergency" && progress !== null && progress < 50

  return (
    <Link
      href={`/funds/${fund.id}`}
      className="block rounded-[13px] border border-border/40 bg-card p-3 shadow-card transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon icon={fund.icon || config.icon} className="h-4 w-4" style={{ color: config.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fund.name}</p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatVNDCompact(fund.current_balance)}
            {target ? ` / ${formatVNDCompact(target)}` : ""}
          </p>
        </div>
        {isUrgent && (
          <Icon
            icon="lucide:alert-circle"
            className="h-4 w-4 shrink-0"
            style={{ color: config.color }}
          />
        )}
      </div>
      {progress !== null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full [transition:width_300ms_ease]"
            style={{
              width: `${progress}%`,
              backgroundColor: color,
            }}
          />
        </div>
      )}
    </Link>
  )
}
