"use client"

import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVNDCompact } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { FUND_TYPE_CONFIG } from "@/types/app"
import type { Fund } from "@/types/app"

type FundCardProps = {
  fund: Fund
  onContribute: (fund: Fund) => void
  onWithdraw: (fund: Fund) => void
}

export function FundCard({ fund, onContribute, onWithdraw }: FundCardProps) {
  const { t } = useTranslation()
  const config = FUND_TYPE_CONFIG[fund.fund_type]
  const color = fund.color || config.color

  const target = fund.target_amount
  const monthly = fund.monthly_contribution ?? 0
  const progress = target && target > 0 ? (fund.current_balance / target) * 100 : null

  const remaining = target ? Math.max(0, target - fund.current_balance) : 0
  const monthsToTarget =
    target && monthly > 0 && remaining > 0 ? Math.ceil(remaining / monthly) : null

  const isUrgent = fund.fund_type === "emergency" && progress !== null && progress < 50
  const isFreedom = fund.fund_type === "freedom" && fund.reset_monthly

  const freedomCap = fund.amount_per_member ?? monthly
  const freedomProgress =
    isFreedom && freedomCap > 0
      ? Math.min((fund.current_balance / freedomCap) * 100, 100)
      : null

  return (
    <div className="mb-2 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon icon={fund.icon || config.icon} className="h-5 w-5" style={{ color: config.color }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{fund.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("funds.deposit")} {formatVNDCompact(monthly)}
                {t("funds.perMonth")}
                {monthsToTarget !== null &&
                  ` · ${monthsToTarget} ${t("funds.monthsToTarget")}`}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-mono text-sm font-semibold tabular-nums text-ink">
                {formatVNDCompact(fund.current_balance)}
              </p>
              {target && (
                <p className="font-mono text-xs tabular-nums text-muted-foreground">
                  / {formatVNDCompact(target)}
                </p>
              )}
            </div>
          </div>

          {progress !== null && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full [transition:width_300ms_ease]"
                  style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
                />
              </div>
              <div className="flex items-center justify-between">
                {isUrgent ? (
                  <span
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: config.color }}
                  >
                    <Icon icon="lucide:alert-circle" className="h-3 w-3" />
                    {t("funds.priorityDeposit")}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground">
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {freedomProgress !== null && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full [transition:width_300ms_ease]"
                  style={{ width: `${freedomProgress}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatVNDCompact(fund.current_balance)} {t("funds.remainingThisMonth")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onContribute(fund)}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-muted text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Icon icon="lucide:plus" className="h-4 w-4" />
          {t("funds.deposit")}
        </button>
        <button
          type="button"
          onClick={() => onWithdraw(fund)}
          disabled={fund.current_balance === 0}
          className={cn(
            "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-muted text-sm font-medium transition-colors",
            fund.current_balance > 0
              ? "text-foreground hover:bg-accent"
              : "cursor-not-allowed text-muted-foreground opacity-40"
          )}
        >
          <Icon icon="lucide:arrow-up-right" className="h-4 w-4" />
          {t("funds.withdraw")}
        </button>
      </div>
    </div>
  )
}
