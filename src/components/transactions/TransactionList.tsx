"use client"

import { useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { TransactionItem } from "@/components/transactions/TransactionItem"
import { TransactionEditSheet } from "@/components/transactions/TransactionEditSheet"
import {
  FilterBar,
  type TransactionFilters,
} from "@/components/transactions/FilterBar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { useSortable } from "@/lib/hooks/useSortable"
import type { TransactionWithJoins } from "@/types/app"

type TransactionListProps = {
  transactions: TransactionWithJoins[]
}

type DateGroup = {
  date: string
  label: string
  items: TransactionWithJoins[]
}

function groupByDate(txs: TransactionWithJoins[]): DateGroup[] {
  const map = new Map<string, TransactionWithJoins[]>()
  for (const tx of txs) {
    const d = tx.transaction_date
    const arr = map.get(d) ?? []
    arr.push(tx)
    map.set(d, arr)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: format(parseISO(date), "EEEE, dd/MM", { locale: vi }),
      items,
    }))
}

export function TransactionList({ transactions }: TransactionListProps) {
  const { t } = useTranslation()
  const [editTx, setEditTx] = useState<TransactionWithJoins | null>(null)
  const [filters, setFilters] = useState<TransactionFilters>({
    categoryId: null,
    accountId: null,
    direction: null,
  })

  const filtered = useMemo(() => {
    let result = transactions
    if (filters.direction) {
      result = result.filter((tx) => tx.direction === filters.direction)
    }
    if (filters.categoryId) {
      result = result.filter((tx) => tx.category_id === filters.categoryId)
    }
    if (filters.accountId) {
      result = result.filter((tx) => tx.account_id === filters.accountId)
    }
    return result
  }, [transactions, filters])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const { sortedData, sortColumn, sortDirection, onSort } =
    useSortable<TransactionWithJoins>(filtered)

  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Desktop: table view */}
      <div className="mt-3 hidden md:block rounded-[15px] border border-border bg-card shadow-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                column="transaction_date"
                sortColumn={sortColumn as string | null}
                sortDirection={sortDirection}
                onSort={(c) => onSort(c as keyof TransactionWithJoins)}
              >
                {t("tx.date")}
              </SortableTableHead>
              <TableHead>{t("tx.category")}</TableHead>
              <TableHead>{t("tx.description")}</TableHead>
              <TableHead>{t("tx.account")}</TableHead>
              <SortableTableHead
                column="amount"
                sortColumn={sortColumn as string | null}
                sortDirection={sortDirection}
                onSort={(c) => onSort(c as keyof TransactionWithJoins)}
                className="text-right"
              >
                {t("tx.amount")}
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((tx) => {
              const isIncome = tx.direction === "in"
              return (
                <TableRow
                  key={tx.id}
                  className="cursor-pointer"
                  onClick={() => setEditTx(tx)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(tx.transaction_date), "dd/MM")}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{tx.category?.name ?? "—"}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="text-sm text-muted-foreground truncate block">
                      {tx.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {tx.account?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "text-sm font-medium font-mono tabular-nums",
                        isIncome ? "text-income" : "text-expense"
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {formatVND(tx.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card/panel view */}
      <div className="mt-3 space-y-4 md:hidden">
        {groups.map((group) => (
          <div key={group.date}>
            <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <div className="divide-y divide-border/40 rounded-[15px] border border-border bg-card shadow-panel">
              {group.items.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onClick={() => setEditTx(tx)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <TransactionEditSheet
        transaction={editTx}
        open={editTx !== null}
        onOpenChange={(open) => {
          if (!open) setEditTx(null)
        }}
      />
    </>
  )
}
