"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { ApexOptions } from "apexcharts"
import { Icon } from "@iconify/react"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { BRAND, SEMANTIC } from "@/lib/design-tokens"
import type { TopExpenseCategory, WeekdaySpending } from "@/types/app"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

const WEEKDAY_KEYS = [
  "common.sun",
  "common.mon",
  "common.tue",
  "common.wed",
  "common.thu",
  "common.fri",
  "common.sat",
]

type IncomeExpenseBarProps = {
  income: number
  expense: number
  lastIncome: number
  lastExpense: number
  month: string
}

export function IncomeExpenseBar({ income, expense, lastIncome, lastExpense, month }: IncomeExpenseBarProps) {
  const { t, locale } = useTranslation()

  const [y, m] = month.split("-").map(Number)
  const prevLabel = new Date(y, m - 2, 1).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "short" })
  const curLabel = new Date(y, m - 1, 1).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "short" })

  const options = useMemo(
    () =>
      ({
        chart: {
          toolbar: { show: false },
          fontFamily: "inherit",
          type: "bar",
          stacked: true,
          stackType: "100%",
        },
        stroke: {
          width: 2,
          colors: ["#fff"],
        },
        colors: [SEMANTIC.info, SEMANTIC.error],
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 8,
            borderRadiusApplication: "around",
            columnWidth: "20px",
          },
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: [prevLabel, curLabel],
          labels: { style: { fontSize: "11px", fontWeight: 600 } },
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
        legend: {
          show: true,
          position: "top",
          horizontalAlign: "right",
          fontSize: "12px",
          markers: { width: 8, height: 8, radius: 4 },
        },
        grid: {
          borderColor: "hsl(var(--border))",
          strokeDashArray: 4,
          yaxis: { lines: { show: true } },
          xaxis: { lines: { show: false } },
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }) as ApexOptions,
    [locale, prevLabel, curLabel],
  );

  const series = useMemo(() => [
    { name: t("dashboard.income"), data: [lastIncome, income] },
    { name: t("dashboard.expense"), data: [lastExpense, expense] },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [income, expense, lastIncome, lastExpense, t])

  return (
    <div className="h-56">
      <Chart type="bar" height="100%" width="100%" options={options} series={series} />
    </div>
  )
}

type WeekdayChartProps = {
  data: WeekdaySpending[]
}

export function WeekdayChart({ data }: WeekdayChartProps) {
  const { t } = useTranslation()
  const maxVal = Math.max(...data.map((d) => d.amount), 1)

  const options = useMemo(() => ({
    chart: { toolbar: { show: false }, fontFamily: "inherit" },
    colors: data.map((d) =>
      d.amount === Math.max(...data.map((x) => x.amount))
        ? BRAND.primary
        : `${BRAND.primary}55`
    ),
    plotOptions: {
      bar: {
        distributed: true,
        horizontal: false,
        borderRadius: 6,
        columnWidth: "60%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: WEEKDAY_KEYS.map((k) => t(k)),
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
    legend: { show: false },
    grid: {
      borderColor: "hsl(var(--border))",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }) as ApexOptions, [data, t])

  const series = useMemo(() => [
    { name: t("dashboard.expense"), data: data.map((d) => d.amount) },
  ], [data, t])

  void maxVal

  return (
    <div className="h-48">
      <Chart type="bar" height="100%" width="100%" options={options} series={series} />
    </div>
  )
}

type TopExpensesProps = {
  categories: TopExpenseCategory[]
  totalExpense: number
  emptyMessage?: string
}

export function TopExpensesWidget({ categories, totalExpense, emptyMessage }: TopExpensesProps) {
  const { t } = useTranslation()

  if (categories.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">{emptyMessage ?? t("common.noData")}</p>
    )
  }

  return (
    <div className="space-y-2.5">
      {categories.map((cat, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm">
            {cat.icon ?? <Icon icon="lucide:tag" className="h-4 w-4 text-primary" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate font-medium">{cat.name}</span>
              <span className="ml-2 shrink-0 font-mono tabular-nums text-muted-foreground">
                {cat.pct}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary [transition:width_400ms_ease]"
                style={{ width: `${Math.min(cat.pct, 100)}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-xs font-mono tabular-nums text-expense">
            {formatVND(cat.amount)}
          </span>
        </div>
      ))}
      <div className="border-t border-border/40 pt-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">{t("dashboard.totalExpense")}</span>
          <span className="font-mono tabular-nums text-expense">{formatVND(totalExpense)}</span>
        </div>
      </div>
    </div>
  )
}
