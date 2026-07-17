import type { ApexOptions } from "apexcharts"
import { BRAND, SEMANTIC } from "@/lib/design-tokens"
import { formatVND } from "@growbase/shared/rules/currency"

export function incomeExpenseComboChart(
  categories: string[],
  income: number[],
  expense: number[],
  labels: { income: string; expense: string; net: string },
): { options: ApexOptions; series: { name: string; type: string; data: number[] }[] } {
  const net = income.map((v, i) => v - (expense[i] ?? 0))

  const series = [
    { name: labels.income, type: "column", data: income },
    { name: labels.expense, type: "column", data: expense },
    { name: labels.net, type: "line", data: net },
  ]

  const options = {
    chart: { toolbar: { show: false }, fontFamily: "inherit", stacked: false },
    colors: [SEMANTIC.success, SEMANTIC.error, BRAND.primary],
    plotOptions: { bar: { horizontal: false, borderRadius: 6, columnWidth: "60%" } },
    stroke: { width: [0, 0, 3], curve: "smooth" },
    markers: { size: [0, 0, 4], strokeWidth: 0 },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
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
    tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => formatVND(v) } },
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
  } as ApexOptions

  return { options, series }
}
