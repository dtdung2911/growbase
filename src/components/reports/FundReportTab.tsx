"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { Icon } from "@iconify/react"
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
import type { Fund } from "@/types/app"
import { BRAND } from "@/lib/design-tokens"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type FundReportTabProps = {
  funds: Fund[]
}

const fundProgress = (fund: Fund): number | null =>
  fund.target_amount && fund.target_amount > 0
    ? Math.round((fund.current_balance / fund.target_amount) * 100)
    : null

export function FundReportTab({ funds }: FundReportTabProps) {
  const { t } = useTranslation()

  const withTarget = useMemo(
    () => funds.filter((f) => f.target_amount && f.target_amount > 0),
    [funds]
  )

  const { sortedData: sortedFunds, sortColumn, sortDirection, onSort } =
    useSortable<Fund>(funds)

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: { stacked: true, toolbar: { show: false }, fontFamily: "inherit" },
      colors: [BRAND.primary, BRAND.tint],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: withTarget.map((f) => f.name),
        labels: {
          style: { fontSize: "10px" },
          formatter: (v: string) => `${Math.round(Number(v) / 1_000_000)}M`,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { fontSize: "11px" } } },
      tooltip: { y: { formatter: (v: number) => formatVND(v) } },
      legend: { show: true, position: "bottom", fontSize: "12px" },
      grid: { borderColor: "hsl(var(--border))", strokeDashArray: 4 },
    }),
    [withTarget]
  )

  const chartSeries = useMemo(
    () => [
      { name: t("reports.balance"), data: withTarget.map((f) => f.current_balance) },
      {
        name: t("reports.remaining"),
        data: withTarget.map((f) =>
          Math.max((f.target_amount ?? 0) - f.current_balance, 0)
        ),
      },
    ],
    [withTarget, t]
  )

  if (funds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("common.noData")}
      </p>
    )
  }

  const totalBalance = funds.reduce((sum, f) => sum + f.current_balance, 0)

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("funds.totalFunds")}</TableHead>
              <TableHead>{t("reports.fundType")}</TableHead>
              <SortableTableHead
                column="current_balance"
                sortColumn={sortColumn as string | null}
                sortDirection={sortDirection}
                onSort={(c) => onSort(c as keyof Fund)}
                className="text-right"
              >
                {t("reports.balance")}
              </SortableTableHead>
              <SortableTableHead
                column="target_amount"
                sortColumn={sortColumn as string | null}
                sortDirection={sortDirection}
                onSort={(c) => onSort(c as keyof Fund)}
                className="text-right"
              >
                {t("funds.target")}
              </SortableTableHead>
              <TableHead className="text-right">{t("reports.completion")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFunds.map((fund) => {
              const progress = fundProgress(fund)
              return (
                <TableRow key={fund.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {fund.icon && <Icon icon={fund.icon} className="h-4 w-4" />}
                      {fund.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t(`funds.type.${fund.fund_type}`)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatVND(fund.current_balance)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {fund.target_amount ? formatVND(fund.target_amount) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {progress !== null ? `${progress}%` : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
            <TableRow className="bg-muted/40">
              <TableCell className="font-medium" colSpan={2}>
                {t("funds.totalFunds")}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums font-medium">
                {formatVND(totalBalance)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {funds.map((fund) => {
          const progress = fundProgress(fund)
          return (
            <div
              key={fund.id}
              className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {fund.icon && <Icon icon={fund.icon} className="h-4 w-4" />}
                  <span className="text-sm font-medium">{fund.name}</span>
                </div>
                <span className="text-sm font-medium font-mono tabular-nums">
                  {formatVND(fund.current_balance)}
                </span>
              </div>
              {progress !== null && (
                <div>
                  <div className="h-1.5 rounded-full bg-primary-soft">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: fund.color ?? BRAND.primary,
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground text-right">
                    {progress}% / {formatVND(fund.target_amount ?? 0)}
                  </p>
                </div>
              )}
            </div>
          )
        })}
        <div className="flex items-center justify-between rounded-[13px] border border-border/40 bg-card px-4 py-3 shadow-card">
          <span className="text-sm font-medium">{t("funds.totalFunds")}</span>
          <span className="text-sm font-medium font-mono tabular-nums">
            {formatVND(totalBalance)}
          </span>
        </div>
      </div>

      {withTarget.length > 0 && (
        <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
          <h3 className="mb-2 text-sm font-medium">{t("reports.completion")}</h3>
          <div className="h-64">
            <Chart key={`fund-${withTarget.length}`} type="bar" height="100%" width="100%" options={chartOptions} series={chartSeries} />
          </div>
        </div>
      )}
    </div>
  )
}
