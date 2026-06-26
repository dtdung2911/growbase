"use client"

import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { TransactionWithJoins } from "@/types/app"

type RecentTransactionsListProps = {
  transactions: TransactionWithJoins[]
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
  const { t } = useTranslation()

  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("common.noData")}
      </p>
    )
  }

  return (
    <div className="rounded-[15px] border border-border bg-card shadow-panel">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-medium">
            {tx.category?.icon ?? tx.category?.name?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">
              {tx.description || tx.category?.name || t("dashboard.noCategory")}
            </p>
            <p className="text-xs text-muted-foreground">
              {tx.account?.name}
            </p>
          </div>
          <span
            className={cn(
              "text-sm font-medium font-mono tabular-nums",
              tx.direction === "in" ? "text-income" : "text-expense"
            )}
          >
            {tx.direction === "in" ? "+" : "-"}{formatVND(tx.amount)}
          </span>
        </div>
      ))}
      <Link
        href="/transactions"
        className="block border-t border-border/50 px-4 py-3 text-center text-sm text-primary hover:bg-accent transition-colors rounded-b-2xl"
      >
        {t("common.viewAll")}
      </Link>
    </div>
  )
}
