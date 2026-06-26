"use client"

import { cn } from "@/lib/utils/cn"
import { Icon } from "@iconify/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { EstimatedExpense, EstimatedExpenseStatus } from "@/types/app"

const STATUS_BADGE_CLASS: Record<EstimatedExpenseStatus, string> = {
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
}

type EstimatedExpenseCardProps = {
  expense: EstimatedExpense
  onEdit: () => void
  onDelete: () => void
}

export function EstimatedExpenseCard({ expense, onEdit, onDelete }: EstimatedExpenseCardProps) {
  const { t, locale } = useTranslation()
  const statusClass = STATUS_BADGE_CLASS[expense.status]

  return (
    <div className="rounded-[15px] border border-border bg-card p-4 shadow-panel">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{expense.name}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className={cn("text-[10px] font-normal", statusClass)}
            >
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
