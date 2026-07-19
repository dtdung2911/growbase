"use client"

import { Icon } from "@iconify/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { EstimatedExpense, EstimatedExpenseStatus } from "@growbase/shared/types/app"
import type { VariantProps } from "class-variance-authority"
import type { badgeVariants } from "@/components/ui/badge"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const STATUS_BADGE_VARIANT: Record<EstimatedExpenseStatus, BadgeVariant> = {
  planned: "default",
  completed: "success",
  cancelled: "secondary",
}

type EstimatedExpenseCardProps = {
  expense: EstimatedExpense
  onEdit: () => void
  onDelete: () => void
}

export function EstimatedExpenseCard({ expense, onEdit, onDelete }: EstimatedExpenseCardProps) {
  const { t, locale } = useTranslation()
  const statusVariant = STATUS_BADGE_VARIANT[expense.status]

  return (
    <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{expense.name}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={statusVariant} className="text-[10px] font-normal">
              {t(`settings.estimated.${expense.status}`)}
            </Badge>
            {expense.linked_fund_id && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                {t("settings.estimated.linkedFund")}
              </Badge>
            )}
          </div>
        </div>

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
            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Icon icon="lucide:trash-2" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <p>{t("settings.estimated.estimatedAmount")}</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatVND(expense.estimated_amount)}
          </p>
        </div>
        {expense.target_date && (
          <div>
            <p>{t("settings.estimated.targetDate")}</p>
            <p className="text-sm text-foreground">
              {new Date(expense.target_date).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
