"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { ApexOptions } from "apexcharts"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
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

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type IncomeTabProps = {
  transactions: TransactionWithJoins[]
}

type IncomeRow = {
  id: string
  source: string
  amount: number
  unusual: boolean
}

export function IncomeTab({ transactions }: IncomeTabProps) {
  const { t } = useTranslation()

  const { rows, total, topSources } = useMemo(() => {
    const rows: IncomeRow[] = []
    let total = 0
    const bySource = new Map<string, number>()

    for (const tx of transactions) {
      if (tx.direction !== "in") continue
      const source = tx.description || tx.category?.name || t("common.other")
      rows.push({ id: tx.id, source, amount: tx.amount, unusual: tx.is_unusual_income })
      total += tx.amount
      bySource.set(source, (bySource.get(source) ?? 0) + tx.amount)
    }

    rows.sort((a, b) => b.amount - a.amount)
    const topSources = Array.from(bySource.entries())
      .map(([source, amount]) => ({ source, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return { rows, total, topSources }
  }, [transactions, t])

  const barOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
      colors: ["#49d68d"],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: topSources.map((s) => s.source),
        labels: {
          style: { fontSize: "10px" },
          formatter: (v: string) => `${Math.round(Number(v) / 1_000_000)}M`,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { fontSize: "11px" } } },
      tooltip: { y: { formatter: (v: number) => formatVND(v) } },
      grid: { borderColor: "hsl(var(--border))", strokeDashArray: 4 },
      legend: { show: false },
    }),
    [topSources]
  )

  const barSeries = useMemo(
    () => [{ name: t("reports.income"), data: topSources.map((s) => s.amount) }],
    [topSources, t]
  )

  const { sortedData, sortColumn, sortDirection, onSort } =
    useSortable<IncomeRow>(rows)

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("common.noData")}
      </p>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,380px)]">
      <div className="hidden rounded-[15px] border border-border bg-card shadow-panel overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reports.source")}</TableHead>
              <SortableTableHead
                column="amount"
                sortColumn={sortColumn as string | null}
                sortDirection={sortDirection}
                onSort={(c) => onSort(c as keyof IncomeRow)}
                className="text-right"
              >
                {t("reports.amount")}
              </SortableTableHead>
              <TableHead className="text-right">{t("reports.type")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.source}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-income">
                  {formatVND(row.amount)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {row.unusual ? t("reports.unusual") : t("reports.regular")}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/40">
              <TableCell className="font-medium">{t("reports.totalIncome")}</TableCell>
              <TableCell className="text-right font-mono tabular-nums font-medium text-income">
                {formatVND(total)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-1 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-[15px] border border-border bg-card px-4 py-3 shadow-panel"
          >
            <div>
              <p className="text-sm">{row.source}</p>
              <p className="text-xs text-muted-foreground">
                {row.unusual ? t("reports.unusual") : t("reports.regular")}
              </p>
            </div>
            <span className="text-sm font-mono tabular-nums text-income">
              +{formatVND(row.amount)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-[15px] border border-border bg-card px-4 py-3 shadow-panel">
          <span className="text-sm font-medium">{t("reports.totalIncome")}</span>
          <span className="text-sm font-medium font-mono tabular-nums text-income">
            {formatVND(total)}
          </span>
        </div>
      </div>

      <div className="rounded-[15px] border border-border bg-card p-4 shadow-panel">
        <h3 className="mb-2 text-sm font-medium">{t("reports.source")}</h3>
        <div className="h-64">
          <Chart type="bar" height="100%" width="100%" options={barOptions} series={barSeries} />
        </div>
      </div>
    </div>
  )
}
