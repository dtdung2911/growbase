"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { ApexOptions } from "apexcharts"
import type { SpendingByBehavior } from "@growbase/shared/types/app"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { BRAND, SEMANTIC } from "@/lib/design-tokens"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type SpendingDonutProps = {
  data: SpendingByBehavior[]
  formatAmount: (n: number) => string
  emptyMessage?: string
}

const BEHAVIOR_COLORS: Record<string, string> = {
  fixed: SEMANTIC.success,
  variable: BRAND.primary,
  wasteful: SEMANTIC.error,
  debt_repayment: SEMANTIC.warning,
  savings_investment: SEMANTIC.violet,
}

export function SpendingDonut({ data, formatAmount, emptyMessage }: SpendingDonutProps) {
  const { t } = useTranslation()

  const safeData = useMemo(
    () => data.filter((e) => Number.isFinite(e.total)),
    [data]
  )
  const hasData = safeData.length > 0

  // Always keep Chart mounted to avoid unmount/resize race condition with ApexCharts
  const series = useMemo(
    () => (hasData ? safeData.map((e) => e.total) : [1]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasData, safeData]
  )
  const labels = useMemo(
    () => (hasData ? safeData.map((e) => t(`behavior.${e.behavior_type}`)) : [""]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasData, safeData, t]
  )
  const colors = useMemo(
    () =>
      hasData
        ? safeData.map((e) => BEHAVIOR_COLORS[e.behavior_type] ?? SEMANTIC.info)
        : ["hsl(var(--border))"],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasData, safeData]
  )

  const options = useMemo(
    () =>
      ({
        chart: { fontFamily: "inherit", animations: { enabled: hasData } },
        labels,
        colors,
        plotOptions: {
          pie: { donut: { size: "82%" } },
        },
        dataLabels: { enabled: false },
        tooltip: {
          enabled: hasData,
          y: { formatter: (v: number) => formatAmount(v) },
        },
        legend: {
          show: hasData,
          position: "bottom",
          fontSize: "12px",
          markers: { size: 5, shape: "circle" as const },
          formatter: (
            seriesName: string,
            opts?: {
              w: { globals: { series: number[] } };
              seriesIndex: number;
            },
          ) => {
            if (!opts) return seriesName;
            const value = opts.w.globals.series[opts.seriesIndex];
            return `${seriesName} — ${formatAmount(value)}`;
          },
        },
        stroke: { width: hasData ? 2 : 0 },
        states: {
          hover: {
            filter: {
              type: hasData ? ("lighten" as const) : ("none" as const),
            },
          },
          active: {
            filter: { type: hasData ? ("darken" as const) : ("none" as const) },
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: { legend: { position: "bottom" } },
          },
        ],
      }) as ApexOptions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasData, labels, colors, formatAmount],
  );

  return (
    <div className="relative flex items-center">
      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground z-1">
          {emptyMessage ?? t("common.noData")}
        </div>
      )}
      <Chart type="donut" width="100%" options={options} series={series} />
    </div>
  );
}
