"use client"

import dynamic from "next/dynamic"
import type { ApexOptions } from "apexcharts"
import { formatVND } from "@/lib/utils/currency"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { useTranslation } from "@/lib/i18n/useTranslation"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type HistoryItem = {
  snapshot_month: string
  total_recorded: number
  total_system: number
  discrepancy: number
}

type NetWorthChartProps = {
  data: HistoryItem[]
  isLoading: boolean
}

export function NetWorthChart({ data, isLoading }: NetWorthChartProps) {
  const { t } = useTranslation()

  if (isLoading) return <SkeletonList />

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("common.noData")}
      </p>
    )
  }

  const categories = data.map((item) => item.snapshot_month.slice(0, 7))

  const series = [
    {
      name: t("netWorth.totalRecorded"),
      data: data.map((item) => item.total_recorded),
    },
    {
      name: t("netWorth.totalSystem"),
      data: data.map((item) => item.total_system),
    },
  ]

  const options: ApexOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
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
        formatter: (v: number) => `${Math.round(v / 1_000_000)}M`,
      },
    },
    tooltip: {
      y: {
        formatter: (v: number) => formatVND(v),
      },
    },
    stroke: {
      width: [2, 1.5],
      curve: "smooth",
      dashArray: [0, 4],
    },
    colors: ["hsl(var(--primary))", "hsl(var(--muted-foreground))"],
    markers: {
      size: [3, 0],
    },
    legend: {
      show: true,
      position: "bottom",
      fontSize: "12px",
    },
    grid: {
      borderColor: "hsl(var(--border))",
      strokeDashArray: 4,
    },
  }

  return (
    <div className="h-64">
      <Chart
        type="line"
        height="100%"
        width="100%"
        options={options}
        series={series}
      />
    </div>
  )
}
