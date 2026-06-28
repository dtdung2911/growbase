"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVND, formatVNDCompact } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useFundDetail, useDeleteFund } from "@/lib/hooks/useFunds"
import { FUND_TYPE_CONFIG } from "@/types/app"
import { ContributeModal } from "@/components/funds/ContributeModal"
import { WithdrawModal } from "@/components/funds/WithdrawModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { SkeletonCard } from "@/components/shared/SkeletonCard"
import { PageHeader } from "@/components/shared/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Fund, FundTransaction } from "@/types/app"

export default function FundDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { t } = useTranslation()
  const { data, isLoading } = useFundDetail(params.id)
  const deleteFund = useDeleteFund(params.id)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 pb-16">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const fund = data?.fund as Fund | undefined
  const history = (data?.history ?? []) as FundTransaction[]

  if (!fund) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t("common.noData")}
      </div>
    )
  }

  const config = FUND_TYPE_CONFIG[fund.fund_type]
  const color = fund.color || config.color
  const target = fund.target_amount
  const progress =
    target && target > 0 ? (fund.current_balance / target) * 100 : null
  const remaining = target ? Math.max(0, target - fund.current_balance) : 0
  const monthly = fund.monthly_contribution ?? 0
  const monthsToTarget =
    monthly > 0 && remaining > 0 ? Math.ceil(remaining / monthly) : null

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-16">
      <PageHeader
        titleKey={`!${fund.name}`}
        breadcrumbs={[
          { labelKey: "nav.funds", href: "/funds" },
          { labelKey: `!${fund.name}` },
        ]}
      />

      {/* Fund header card */}
      <div className="rounded-[15px] border border-border bg-card p-5 shadow-panel">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon icon={fund.icon || config.icon} className="h-6 w-6" style={{ color: config.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-ink">{fund.name}</h1>
            <p className="text-xs text-muted-foreground">
              {t("funds.deposit")} {formatVNDCompact(monthly)}
              {t("funds.perMonth")}
              {monthsToTarget !== null &&
                ` · ${monthsToTarget} ${t("funds.monthsToTarget")}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          >
            <Icon icon="lucide:trash-2" className="h-4 w-4" />
          </button>
        </div>

        {/* Balance */}
        <div className="rounded-xl bg-muted/50 p-4 mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {t("funds.currentBalance")}
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-ink">
              {formatVND(fund.current_balance)}
            </span>
          </div>
          {progress !== null && (
            <>
              <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full [transition:width_300ms_ease]"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>
                  {t("budget.remaining")}{" "}
                  {formatVNDCompact(remaining)}
                </span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setContributeOpen(true)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {t("funds.deposit")}
          </button>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            disabled={fund.current_balance === 0}
            className={cn(
              "flex min-h-[44px] items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors",
              fund.current_balance > 0
                ? "border-border text-foreground hover:bg-accent"
                : "cursor-not-allowed border-border text-muted-foreground opacity-40"
            )}
          >
            <Icon icon="lucide:arrow-up-right" className="h-4 w-4" />
            {t("funds.withdraw")}
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <Tabs defaultValue="history">
        <TabsList className="w-full">
          <TabsTrigger value="history" className="flex-1 text-xs">
            {t("funds.history")}
          </TabsTrigger>
          <TabsTrigger value="info" className="flex-1 text-xs">
            {t("funds.info")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-3">
          {history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("common.noData")}
            </p>
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden md:block rounded-[15px] border border-border bg-card shadow-panel">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("tx.date")}</TableHead>
                      <TableHead>{t("tx.description")}</TableHead>
                      <TableHead className="text-right">
                        {t("tx.amount")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("funds.balance")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((tx) => {
                      const isIn = tx.direction === "in"
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {tx.transaction_date}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.description ||
                              (isIn
                                ? t("funds.deposit")
                                : t("funds.withdraw"))}
                            {tx.is_automatic && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">
                                ({t("funds.auto")})
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono tabular-nums text-sm font-medium",
                              isIn ? "text-income" : "text-[#EF9F27]"
                            )}
                          >
                            {isIn ? "+" : "−"}
                            {formatVND(tx.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground">
                            {formatVNDCompact(tx.balance_after)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: cards */}
              <div className="space-y-2 md:hidden">
                {history.map((tx) => {
                  const isIn = tx.direction === "in"
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 rounded-[15px] border border-border bg-card p-3 shadow-panel"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
                          isIn ? "bg-[#EAF3DE]" : "bg-[#FAEEDA]"
                        )}
                      >
                        {isIn ? "↓" : "↑"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {tx.description ||
                            (isIn
                              ? t("funds.deposit")
                              : t("funds.withdraw"))}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {tx.transaction_date}
                          {tx.is_automatic && ` · ${t("funds.auto")}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "font-mono text-sm font-medium tabular-nums",
                            isIn ? "text-income" : "text-[#EF9F27]"
                          )}
                        >
                          {isIn ? "+" : "−"}
                          {formatVND(tx.amount)}
                        </p>
                        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          = {formatVNDCompact(tx.balance_after)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="info" className="mt-3">
          <div className="rounded-[15px] border border-border bg-card p-4 shadow-panel space-y-3">
            <InfoRow label={t("funds.fundType")} value={t(`funds.type.${fund.fund_type}`)} />
            <InfoRow label={t("funds.monthlyAmount")} value={formatVND(monthly)} mono />
            <InfoRow label={t("funds.contributionDay")} value={`${fund.contribution_day}`} />
            {target && <InfoRow label={t("funds.targetAmount")} value={formatVND(target)} mono />}
            {fund.target_date && <InfoRow label={t("funds.targetDate")} value={fund.target_date} />}
            {fund.expected_return_rate !== null && fund.expected_return_rate !== undefined && (
              <InfoRow label={t("funds.returnRate")} value={`${fund.expected_return_rate}%`} />
            )}
            {fund.description && <InfoRow label={t("funds.description")} value={fund.description} />}
            <InfoRow label={t("funds.priority")} value={`${fund.priority}`} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ContributeModal
        fund={contributeOpen ? fund : null}
        open={contributeOpen}
        onClose={() => setContributeOpen(false)}
      />
      <WithdrawModal
        fund={withdrawOpen ? fund : null}
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("funds.deleteFund")}
        description={t("funds.deleteConfirm")}
        onConfirm={() => {
          deleteFund.mutate(undefined, {
            onSuccess: () => {
              window.location.href = "/funds"
            },
          })
        }}
        isPending={deleteFund.isPending}
      />
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono tabular-nums")}>
        {value}
      </span>
    </div>
  )
}
