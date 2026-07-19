"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@growbase/shared/rules/currency"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { COST_TYPE_BADGE_VARIANT } from "@/lib/constants/costTypeBadge"
import type { TransactionWithJoins, BehaviorType } from "@growbase/shared/types/app"

type TransactionItemProps = {
  transaction: TransactionWithJoins
  costTypeCode?: string | null
  onClick?: () => void
}

export function TransactionItem({ transaction: tx, costTypeCode, onClick }: TransactionItemProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const isIncome = tx.direction === "in"
  const categoryName = tx.category?.name ?? t("tx.uncategorized")
  const categoryIcon = tx.category?.icon ?? "💰"
  const behaviorType = tx.behavior_type as BehaviorType | null

  return (
    <button
      onClick={onClick}
      className="flex w-full min-h-[44px] items-center gap-3 px-3 py-[17px] text-left transition-colors hover:bg-accent active:bg-accent first:rounded-t-2xl last:rounded-b-2xl"
    >
      {/* Category circle */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-lg"
        style={
          tx.account?.color
            ? { backgroundColor: tx.account.color + "20" }
            : undefined
        }
      >
        {categoryIcon}
      </div>

      {/* Name + desc */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-extrabold">{categoryName}</span>
          {costTypeCode ? (
            <Badge
              variant={COST_TYPE_BADGE_VARIANT[costTypeCode] ?? "secondary"}
              className="shrink-0 text-[10px] px-1 py-0"
            >
              {t(`behavior.${costTypeCode}`)}
            </Badge>
          ) : behaviorType ? (
            <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0">
              {t(`behavior.${behaviorType}`)}
            </Badge>
          ) : null}
          {tx.fund_id && tx.fund && (
            // Row là <button> nên không nest <a> — span role=link + stopPropagation
            <Badge
              variant="secondary"
              role="link"
              tabIndex={0}
              aria-label={t("tx.viewFund")}
              className="shrink-0 cursor-pointer text-[10px] px-1 py-0 hover:brightness-[0.8]"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/funds/${tx.fund_id}`)
              }}
            >
              · {tx.fund.name}
            </Badge>
          )}
        </div>
        {tx.description && (
          <p className="truncate text-xs text-muted-foreground">
            {tx.description}
          </p>
        )}
      </div>

      {/* Amount */}
      <span
        className={cn(
          "shrink-0 text-sm font-semibold font-mono tabular-nums",
          isIncome ? "text-income" : "text-expense"
        )}
      >
        {isIncome ? "+" : "-"}
        {formatVND(tx.amount)}
      </span>
    </button>
  )
}
