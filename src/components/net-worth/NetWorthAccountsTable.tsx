"use client"

import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useSortable } from "@/lib/hooks/useSortable"
import { cn } from "@/lib/utils/cn"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Input } from "@/components/ui/input"

export type NetWorthAccountRowData = {
  account_id: string
  account_name: string
  account_type: string
  system_balance: number
  recorded_balance: number
  difference: number
}

type NetWorthAccountsTableProps = {
  rows: NetWorthAccountRowData[]
  onBalanceChange: (accountId: string, value: number) => void
}

export function NetWorthAccountsTable({ rows, onBalanceChange }: NetWorthAccountsTableProps) {
  const { t } = useTranslation()
  const { sortedData, sortColumn, sortDirection, onSort } =
    useSortable<NetWorthAccountRowData>(rows)
  const headProps = {
    sortColumn: sortColumn as string | null,
    sortDirection,
    onSort: onSort as (column: string) => void,
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead column="account_name" {...headProps}>
            {t("netWorth.accountName")}
          </SortableTableHead>
          <SortableTableHead column="account_type" {...headProps}>
            {t("netWorth.accountType")}
          </SortableTableHead>
          <SortableTableHead column="system_balance" className="text-right" {...headProps}>
            {t("netWorth.systemBalance")}
          </SortableTableHead>
          <SortableTableHead column="recorded_balance" className="text-right" {...headProps}>
            {t("netWorth.recordedBalance")}
          </SortableTableHead>
          <SortableTableHead column="difference" className="text-right" {...headProps}>
            {t("netWorth.difference")}
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((row) => {
          const mismatch = row.difference !== 0
          return (
            <TableRow
              key={row.account_id}
              className={cn(mismatch && "border-warning/20 bg-warning-soft/40")}
            >
              <TableCell className="font-medium">{row.account_name}</TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {row.account_type}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatVND(row.system_balance)}
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  value={row.recorded_balance || ""}
                  onChange={(e) => onBalanceChange(row.account_id, Number(e.target.value) || 0)}
                  className="ml-auto h-11 max-w-[140px] text-right text-base font-mono tabular-nums"
                  placeholder="0"
                />
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono tabular-nums",
                  mismatch ? "text-warning" : "text-muted-foreground"
                )}
              >
                {formatVND(row.difference)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
