"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { ApexOptions } from "apexcharts"
import { formatVND } from "@growbase/shared/rules/currency"
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
import { BRAND, SEMANTIC } from "@/lib/design-tokens"
import { incomeExpenseComboChart } from "@/lib/charts/incomeExpenseChart"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type OverviewTabProps = {
  data: MonthlySummaryRow[]
}

const toMonthLabel = (month: string) => {
  const [y, m] = month.split("-")
  return `${m}/${y?.slice(2)}`
}

const behaviorTotal = (row: MonthlySummaryRow, key: string) =>
  row.byBehavior[key]?.total ?? 0

const behaviorPct = (row: MonthlySummaryRow, key: string) =>
  row.byBehavior[key]?.pct ?? 0

const BEHAVIOR_COLORS: Record<string, string> = {
  fixed: BRAND.primary,
  essential_variable: SEMANTIC.info,
  lifestyle: SEMANTIC.violet,
  wasteful: SEMANTIC.error,
  savings_investment: SEMANTIC.success,
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { t } = useTranslation()

  const categories = useMemo(() => data.map((r) => toMonthLabel(r.month)), [data])

  const { options: incomeExpenseOptions, series: incomeExpenseSeries } =
    incomeExpenseComboChart(
      categories,
      data.map((r) => r.totalIncome),
      data.map((r) => r.totalExpense),
      { income: t("reports.income"), expense: t("reports.spending"), net: t("reports.net") },
    )

  // Smooth area line: savings rate
  const savingsRateOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
      },
      colors: [BRAND.primary],
      dataLabels: { enabled: false },
      stroke: { width: 2.5, curve: "smooth" },
      fill: {
        type: "gradient",
        gradient: { opacityFrom: 0.35, opacityTo: 0.02 },
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        fillOpacity: 1,
      },
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
      tooltip: {
        y: { formatter: (v: number) => `${v}%` },
        marker: { show: true },
      },
      legend: { show: false },
      grid: {
        borderColor: "hsl(var(--border))",
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
    }) as ApexOptions,
    [categories]
  )

  const savingsRateSeries = useMemo(
    () => [{ name: t("reports.savingsRate"), data: data.map((r) => r.savingsRate) }],
    [data, t]
  )

  // Stacked bar: behavior breakdown
  const BEHAVIORS = ["fixed", "essential_variable", "lifestyle", "wasteful", "savings_investment"]
  const behaviorLabels: Record<string, string> = {
    fixed: t("reports.fixed"),
    essential_variable: t("reports.variable"),
    lifestyle: t("reports.lifestyle"),
    wasteful: t("reports.wasteful"),
    savings_investment: t("reports.savings"),
  }

  const behaviorOptions = useMemo(
    () =>
      ({
        chart: {
          stacked: true,
          toolbar: { show: false },
          fontFamily: "inherit",
        },
        colors: BEHAVIORS.map((b) => BEHAVIOR_COLORS[b]) as string[],
        dataLabels: { enabled: false },
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
        tooltip: {
          shared: true,
          intersect: false,
          y: { formatter: (v: number) => formatVND(v) },
        },
        legend: {
          show: true,
          position: "bottom",
          fontSize: "11px",
          markers: { width: 8, height: 8, radius: 4 },
        },
        grid: {
          borderColor: "hsl(var(--border))",
          strokeDashArray: 4,
          yaxis: { lines: { show: true } },
          xaxis: { lines: { show: false } },
        },
      }) as ApexOptions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, t],
  );

  const behaviorSeries = useMemo(
    () =>
      BEHAVIORS.map((b) => ({
        name: behaviorLabels[b] ?? b,
        data: data.map((r) => behaviorTotal(r, b)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Summary table */}
      <div className="overflow-hidden rounded-[13px] border border-border/40 bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reports.month")}</TableHead>
              <TableHead className="text-right">
                {t("reports.totalIncome")}
              </TableHead>
              <TableHead className="text-right">
                {t("reports.totalExpense")}
              </TableHead>
              <TableHead className="text-right">
                {t("reports.expenseRatio")}
              </TableHead>
              <TableHead className="text-right">
                {t("reports.savings")}
              </TableHead>
              <TableHead className="text-right">
                {t("reports.savingsRate")}
              </TableHead>
              <TableHead className="text-right">{t("reports.fixed")}</TableHead>
              <TableHead className="text-right">
                {t("reports.variable")}
              </TableHead>
              <TableHead className="text-right">
                {t("reports.wasteful")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">
                  {toMonthLabel(row.month)}
                </TableCell>
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

      {/* Charts row 1: grouped bar + savings rate area */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
          <h3 className="mb-0.5 text-sm font-semibold">
            {t("reports.incomeVsExpense")}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("reports.last6months")}
          </p>
          <div className="h-64">
            <Chart
              key={`ie-${categories.join(",")}`}
              type="line"
              height="100%"
              width="100%"
              options={incomeExpenseOptions}
              series={incomeExpenseSeries}
            />
          </div>
        </div>
        <div className="rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
          <h3 className="mb-0.5 text-sm font-semibold">
            {t("reports.savingsRate")}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("reports.trendOverTime")}
          </p>
          <div className="h-64">
            <Chart
              key={`sr-${categories.join(",")}`}
              type="area"
              height="100%"
              width="100%"
              options={savingsRateOptions}
              series={savingsRateSeries}
            />
          </div>
        </div>
      </div>

      {/* Charts row 2: stacked behavior bar (full width) */}
      <div className="rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
        <h3 className="mb-0.5 text-sm font-semibold">
          {t("reports.expenseBreakdown")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("reports.byBehaviorType")}
        </p>
        <div className="h-72">
          <Chart
            key={`bv-${categories.join(",")}`}
            type="bar"
            height="100%"
            width="100%"
            options={behaviorOptions}
            series={behaviorSeries}
          />
        </div>
      </div>
    </div>
  );
}
