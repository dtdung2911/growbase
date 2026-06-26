"use client"

import dynamic from "next/dynamic"
import type { ApexOptions } from "apexcharts"
import type { SpendingByBehavior } from "@/types/app"
import { useTranslation } from "@/lib/i18n/useTranslation"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type SpendingDonutProps = {
  data: SpendingByBehavior[]
  formatAmount: (n: number) => string
}

const BEHAVIOR_COLORS: Record<string, string> = {
  fixed: "#49d68d",
  variable: "#0084DB",
  wasteful: "#ff917d",
  debt_repayment: "#ffbd6f",
  savings_investment: "#9b78ff",
}

export function SpendingDonut({ data, formatAmount }: SpendingDonutProps) {
  const { t } = useTranslation()

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {t("common.noData")}
      </div>
    )
  }

  const series = data.map((entry) => entry.total)
  const labels = data.map((entry) => t(`behavior.${entry.behavior_type}`))
  const colors = data.map(
    (entry) => BEHAVIOR_COLORS[entry.behavior_type] ?? "#94A3B8"
  )

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    labels,
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: "55%",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (v: number) => formatAmount(v),
      },
    },
    legend: {
      position: "right",
      fontSize: "12px",
      markers: {
        size: 5,
        shape: "circle",
      },
      formatter: (seriesName: string, opts?: { w: { globals: { series: number[] } }; seriesIndex: number }) => {
        if (!opts) return seriesName
        const value = opts.w.globals.series[opts.seriesIndex]
        return `${seriesName} — ${formatAmount(value)}`
      },
    },
    stroke: {
      width: 2,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  }

  return (
    <div className="flex items-center">
      <Chart
        type="donut"
        height={160}
        width="100%"
        options={options}
        series={series}
      />
    </div>
  )
}
