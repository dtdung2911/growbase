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
    chart: { toolbar: { show: true }, fontFamily: "inherit", stacked: true },
    colors: [BRAND.primary, SEMANTIC.error, SEMANTIC.warning],
    // plotOptions: { bar: { horizontal: false, borderRadius: 6, columnWidth: "20%" } },
    stroke: { width: [2, 2, 2], curve: "smooth" },
    markers: { size: [2, 2, 4], strokeWidth: 1 },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      axisBorder: { show: true },
      axisTicks: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "18%",
        borderRadius: 10,
        borderRadiusApplication: 'around', // 'around', 'end'
        borderRadiusWhenStacked: 'all', // 'all', 'last'
        isFunnel3d: true
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
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
  } as ApexOptions

  return { options, series }
}
