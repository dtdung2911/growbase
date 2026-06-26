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
import type { MonthlySummaryRow } from "@/lib/hooks/useMonthlyReport"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type OverviewTabProps = {
  data: MonthlySummaryRow[]
}

const toMonthLabel = (month: string) => {
  const [y, m] = month.split("-")
  return `${m}/${y}`
}

const behaviorTotal = (row: MonthlySummaryRow, key: string) =>
  row.byBehavior[key]?.total ?? 0

const behaviorPct = (row: MonthlySummaryRow, key: string) =>
  row.byBehavior[key]?.pct ?? 0

export function OverviewTab({ data }: OverviewTabProps) {
  const { t } = useTranslation()

  const categories = useMemo(() => data.map((r) => toMonthLabel(r.month)), [data])

  const incomeExpenseOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit" },
      colors: ["#49d68d", "#ff917d"],
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: "smooth" },
      fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
      xaxis: {
        categories,
        labels: { style: { fontSize: "10px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { fontSize: "10px" },
          formatter: (v: number) => `${Math.round(v / 1_000_000)}M`,
        },
      },
      tooltip: { y: { formatter: (v: number) => formatVND(v) } },
      legend: { show: true, position: "bottom", fontSize: "12px" },
      grid: { borderColor: "hsl(var(--border))", strokeDashArray: 4 },
    }),
    [categories]
  )

  const incomeExpenseSeries = useMemo(
    () => [
      { name: t("reports.income"), data: data.map((r) => r.totalIncome) },
      { name: t("reports.spending"), data: data.map((r) => r.totalExpense) },
    ],
    [data, t]
  )

  const savingsRateOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit" },
      colors: ["#0084DB"],
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: "smooth" },
      markers: { size: 3 },
      xaxis: {
        categories,
        labels: { style: { fontSize: "10px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { fontSize: "10px" },
          formatter: (v: number) => `${Math.round(v)}%`,
        },
      },
      tooltip: { y: { formatter: (v: number) => `${v}%` } },
      legend: { show: false },
      grid: { borderColor: "hsl(var(--border))", strokeDashArray: 4 },
    }),
    [categories]
  )

  const savingsRateSeries = useMemo(
    () => [{ name: t("reports.savingsRate"), data: data.map((r) => r.savingsRate) }],
    [data, t]
  )

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("common.noData")}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[15px] border border-border bg-card shadow-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reports.month")}</TableHead>
              <TableHead className="text-right">{t("reports.totalIncome")}</TableHead>
              <TableHead className="text-right">{t("reports.totalExpense")}</TableHead>
              <TableHead className="text-right">{t("reports.expenseRatio")}</TableHead>
              <TableHead className="text-right">{t("reports.savings")}</TableHead>
              <TableHead className="text-right">{t("reports.savingsRate")}</TableHead>
              <TableHead className="text-right">{t("reports.fixed")}</TableHead>
              <TableHead className="text-right">{t("reports.variable")}</TableHead>
              <TableHead className="text-right">{t("reports.wasteful")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{toMonthLabel(row.month)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-income">
                  {formatVND(row.totalIncome)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-expense">
                  {formatVND(row.totalExpense)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {row.expenseRatio}%
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatVND(row.savings)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-primary">
                  {row.savingsRate}%
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatVND(behaviorTotal(row, "fixed"))}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {behaviorPct(row, "fixed")}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatVND(behaviorTotal(row, "variable"))}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {behaviorPct(row, "variable")}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatVND(behaviorTotal(row, "wasteful"))}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {behaviorPct(row, "wasteful")}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[15px] border border-border bg-card p-4 shadow-panel">
          <h3 className="mb-2 text-sm font-medium">{t("reports.incomeVsExpense")}</h3>
          <div className="h-64">
            <Chart type="area" height="100%" width="100%" options={incomeExpenseOptions} series={incomeExpenseSeries} />
          </div>
        </div>
        <div className="rounded-[15px] border border-border bg-card p-4 shadow-panel">
          <h3 className="mb-2 text-sm font-medium">{t("reports.savingsRate")}</h3>
          <div className="h-64">
            <Chart type="line" height="100%" width="100%" options={savingsRateOptions} series={savingsRateSeries} />
          </div>
        </div>
      </div>
    </div>
  )
}
