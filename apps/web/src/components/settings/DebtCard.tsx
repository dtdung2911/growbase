"use client"

import { Icon } from "@iconify/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { DebtEntry } from "@growbase/shared/types/app"
import type { VariantProps } from "class-variance-authority"
import type { badgeVariants } from "@/components/ui/badge"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  active: "warning",
  paid_off: "success",
  refinanced: "info",
}

type DebtCardProps = {
  debt: DebtEntry
  onEdit: () => void
  onPaidOff: () => void
}

export function DebtCard({ debt, onEdit, onPaidOff }: DebtCardProps) {
  const { t } = useTranslation()
  const isActive = debt.status === "active"
  const statusVariant = STATUS_BADGE_VARIANT[debt.status]

  return (
    <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{debt.creditor_name}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px] font-normal">
              {t(`settings.debt.type.${debt.debt_type}`)}
            </Badge>
            {statusVariant && (
              <Badge variant={statusVariant} className="text-[10px] font-normal">
                {t(`settings.debt.status.${debt.status}`)}
              </Badge>
            )}
          </div>
        </div>

        {isActive && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={onEdit}
            >
              <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] text-success hover:text-success"
              onClick={onPaidOff}
            >
              <Icon icon="lucide:check" className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <p>{t("settings.debt.monthlyPayment")}</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatVND(debt.monthly_payment)}
          </p>
        </div>
        <div>
          <p>{t("settings.debt.remaining")}</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatVND(debt.remaining_amount)}
          </p>
        </div>
        {debt.interest_rate !== null && (
          <div>
            <p>{t("settings.debt.interestRate")}</p>
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {debt.interest_rate}%
            </p>
          </div>
        )}
        <div>
          <p>{t("settings.debt.totalDebt")}</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatVND(debt.total_amount)}
          </p>
        </div>
      </div>
    </div>
  )
}
