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

type NetWorthHistoryItem = {
  snapshot_month: string
  total_recorded: number
  total_system: number
  discrepancy: number
}

export type NetWorthHistoryRowData = {
  month: string
  netWorthAmount: number
  change: number | null
}

type NetWorthHistoryTableProps = {
  data: NetWorthHistoryItem[]
}

export function NetWorthHistoryTable({ data }: NetWorthHistoryTableProps) {
  const { t } = useTranslation()

  // history items arrive oldest→newest; change = this month recorded − previous month
  const rows: NetWorthHistoryRowData[] = data.map((item, index) => ({
    month: item.snapshot_month.slice(0, 7),
    netWorthAmount: item.total_recorded,
    change: index === 0 ? null : item.total_recorded - data[index - 1].total_recorded,
  }))

  const { sortedData, sortColumn, sortDirection, onSort } =
    useSortable<NetWorthHistoryRowData>(rows, { column: "month", direction: "desc" })
  const headProps = {
    sortColumn: sortColumn as string | null,
    sortDirection,
    onSort: onSort as (column: string) => void,
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead column="month" {...headProps}>
            {t("netWorth.month")}
          </SortableTableHead>
          <SortableTableHead column="netWorthAmount" className="text-right" {...headProps}>
            {t("netWorth.netWorthAmount")}
          </SortableTableHead>
          <SortableTableHead column="change" className="text-right" {...headProps}>
            {t("netWorth.change")}
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((row) => (
          <TableRow key={row.month}>
            <TableCell className="font-mono tabular-nums">{row.month}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatVND(row.netWorthAmount)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-mono tabular-nums",
                row.change === null && "text-muted-foreground",
                row.change !== null && row.change > 0 && "text-success",
                row.change !== null && row.change < 0 && "text-destructive"
              )}
            >
              {row.change === null
                ? "—"
                : `${row.change > 0 ? "+" : ""}${formatVND(row.change)}`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
