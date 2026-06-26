"use client"

import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { cn } from "@/lib/utils/cn"
import { Input } from "@/components/ui/input"

type NetWorthAccountRowProps = {
  accountName: string
  accountType: string
  systemBalance: number
  recordedBalance: number
  onBalanceChange: (value: number) => void
}

export function NetWorthAccountRow({
  accountName,
  accountType,
  systemBalance,
  recordedBalance,
  onBalanceChange,
}: NetWorthAccountRowProps) {
  const { t } = useTranslation()
  const difference = recordedBalance - systemBalance
  const mismatch = difference !== 0

  return (
    <div
      className={cn(
        "space-y-2 rounded-[15px] border bg-card p-4 shadow-panel",
        mismatch ? "border-warning/20" : "border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{accountName}</p>
          <p className="text-xs capitalize text-muted-foreground">{accountType}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("netWorth.systemBalance")}</span>
        <span className="font-mono tabular-nums">{formatVND(systemBalance)}</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="shrink-0 text-xs text-muted-foreground">
          {t("netWorth.recordedBalance")}
        </label>
        <Input
          type="number"
          value={recordedBalance || ""}
          onChange={(e) => onBalanceChange(Number(e.target.value) || 0)}
          className="min-h-[44px] flex-1 text-right text-base font-mono tabular-nums"
          placeholder="0"
        />
      </div>
      {mismatch && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("netWorth.difference")}</span>
          <span className="font-mono tabular-nums text-warning">{formatVND(difference)}</span>
        </div>
      )}
    </div>
  )
}
