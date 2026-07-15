"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { ApexOptions } from "apexcharts"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import {
  BUDGET_TEMPLATE,
  COST_TYPE_GROUP_LABELS,
  type CostTypeGroupKey,
} from "@growbase/shared/constants/budgetTemplate"
import type { BudgetActualLine } from "@growbase/shared/types/app"
import { BRAND, SEMANTIC } from "@/lib/design-tokens"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type BudgetVsActualTabProps = {
  budgetLines: BudgetActualLine[]
}

type BudgetStatus = "safe" | "monitor" | "warning" | "over"

const getStatus = (usagePct: number): BudgetStatus => {
  if (usagePct >= 100) return "over"
  if (usagePct >= 86) return "warning"
  if (usagePct >= 70) return "monitor"
  return "safe"
}

const STATUS_CLASS: Record<BudgetStatus, string> = {
  safe: "bg-success-soft text-success",
  monitor: "bg-info/10 text-info",
  warning: "bg-warning-soft text-warning",
  over: "bg-destructive/10 text-destructive",
}

const GROUP_ORDER: CostTypeGroupKey[] = [
  "fixed",
  "variable",
  "wasteful",
  "savings_investment",
  "debt_repayment",
  "other",
]

export function BudgetVsActualTab({ budgetLines }: BudgetVsActualTabProps) {
  const { t, locale } = useTranslation()

  const grouped = useMemo(() => {
    const nameToGroup = new Map<string, CostTypeGroupKey>()
    for (const tpl of BUDGET_TEMPLATE) {
      nameToGroup.set(tpl.name, tpl.costTypeGroup)
    }

    const byGroup = new Map<CostTypeGroupKey, BudgetActualLine[]>()
    for (const line of budgetLines) {
      const group = nameToGroup.get(line.cost_type_name) ?? "other"
      if (!byGroup.has(group)) byGroup.set(group, [])
      byGroup.get(group)!.push(line)
    }

    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      group: g,
      label: locale === "vi" ? COST_TYPE_GROUP_LABELS[g].vi : COST_TYPE_GROUP_LABELS[g].en,
      lines: byGroup.get(g)!,
    }))
  }, [budgetLines, locale])

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, fontFamily: "inherit", stacked: false },
      colors: [BRAND.primary, SEMANTIC.error],
      plotOptions: { bar: { horizontal: false, borderRadius: 3, columnWidth: "60%" } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: budgetLines.map((l) => l.cost_type_name),
        labels: { style: { fontSize: "9px" }, rotate: -45, trim: true, hideOverlappingLabels: false },
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
    [budgetLines]
  )

  const chartSeries = useMemo(
    () => [
      { name: t("budget.allocated"), data: budgetLines.map((l) => l.budget_amount) },
      { name: t("budget.spent"), data: budgetLines.map((l) => l.actual_amount) },
    ],
    [budgetLines, t]
  )

  if (budgetLines.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("common.noData")}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Card-style groups — cùng UI mọi breakpoint, 2 cột dòng chi tiết trên desktop */}
      <div className="space-y-3">
        {grouped.map((section) => (
          <div key={section.group} className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {section.lines.map((line) => {
                const status = getStatus(line.usage_pct)
                return (
                  <div
                    key={line.cost_type_id}
                    className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{line.cost_type_name}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLASS[status])}>
                        {Math.round(line.usage_pct)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {t("budget.spent")}:{" "}
                        <span className="font-mono tabular-nums">{formatVND(line.actual_amount)}</span>
                      </span>
                      <span>
                        {t("budget.allocated")}:{" "}
                        <span className="font-mono tabular-nums">{formatVND(line.budget_amount)}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
        <h3 className="mb-2 text-sm font-medium">{t("reports.budgetVsActual")}</h3>
        <div className="h-72">
          <Chart type="bar" height="100%" width="100%" options={chartOptions} series={chartSeries} />
        </div>
      </div>
    </div>
  )
}

