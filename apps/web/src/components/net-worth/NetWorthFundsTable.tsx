"use client"

import { Icon } from "@iconify/react"
import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useSortable } from "@/lib/hooks/useSortable"
import { FUND_TYPE_CONFIG, type FundType } from "@growbase/shared/types/app"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Badge } from "@/components/ui/badge"

export type NetWorthFundRowData = {
  id: string
  name: string
  fund_type: string
  current_balance: number
  icon?: string | null
}

type NetWorthFundsTableProps = {
  rows: NetWorthFundRowData[]
}

export function NetWorthFundsTable({ rows }: NetWorthFundsTableProps) {
  const { t, locale } = useTranslation()
  const { sortedData, sortColumn, sortDirection, onSort } =
    useSortable<NetWorthFundRowData>(rows)
  const headProps = {
    sortColumn: sortColumn as string | null,
    sortDirection,
    onSort: onSort as (column: string) => void,
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead column="name" {...headProps}>
            {t("netWorth.accountName")}
          </SortableTableHead>
          <SortableTableHead column="fund_type" {...headProps}>
            {t("netWorth.accountType")}
          </SortableTableHead>
          <SortableTableHead column="current_balance" className="text-right" {...headProps}>
            {t("netWorth.systemBalance")}
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((row) => {
          const config = FUND_TYPE_CONFIG[row.fund_type as FundType]
          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>
                {config ? (
                  <Badge variant="outline" className="gap-1">
                    <Icon icon={row.icon || config.icon} className="h-3.5 w-3.5" style={{ color: config.color }} />
                    {locale === "vi" ? config.label : config.labelEn}
                  </Badge>
                ) : (
                  <span className="capitalize text-muted-foreground">{row.fund_type}</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatVND(row.current_balance)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
