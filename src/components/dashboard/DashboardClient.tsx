"use client"

import { useState } from "react"
import { useDashboardData } from "@/lib/hooks/useDashboard"
import { useTransactionReminder } from "@/lib/hooks/useTransactionReminder"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import { MetricCard } from "@/components/shared/MetricCard"
import { SpendingDonut } from "@/components/shared/SpendingDonut"
import { BudgetProgressBar } from "@/components/shared/BudgetProgressBar"
import { SkeletonCard } from "@/components/shared/SkeletonCard"
import { SkeletonList } from "@/components/shared/SkeletonList"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils/cn"
import { FundOverviewCard } from "@/components/dashboard/FundOverviewCard"
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList"
import { TransactionReminder } from "@/components/shared/TransactionReminder"
import { QuickAddSheet } from "@/components/transactions/QuickAddSheet"
import type { BudgetActualLine } from "@/types/app"

export function DashboardClient() {
  const { data, isLoading } = useDashboardData()
  const { showReminder, dismiss } = useTransactionReminder()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonList />
      </div>
    )
  }

  if (!data) return null

  const savings = data.totalIncome - data.totalExpense

  return (
    <div className="space-y-6">
      {showReminder && (
        <TransactionReminder
          onAdd={() => setQuickAddOpen(true)}
          onDismiss={dismiss}
        />
      )}

      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label={t("dashboard.income")}
          amount={data.totalIncome}
          formatAmount={formatVND}
          trend="up"
          icon="lucide:trending-up"
          variant="income"
        />
        <MetricCard
          label={t("dashboard.expense")}
          amount={data.totalExpense}
          formatAmount={formatVND}
          trend="down"
          icon="lucide:trending-down"
          variant="expense"
        />
        <MetricCard
          label={t("dashboard.savings")}
          amount={savings}
          formatAmount={formatVND}
          trend={savings >= 0 ? "up" : "down"}
          icon="lucide:piggy-bank"
        />
        <MetricCard
          label={t("dashboard.savingsRate")}
          amount={data.savingsRate}
          formatAmount={(n) => `${n}%`}
          trend={data.savingsRate >= 0 ? "up" : "down"}
          icon="lucide:percent"
        />
      </div>

      {/* Spending + Budget row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[15px] border border-border bg-card p-7 shadow-panel">
          <h2 className="text-base font-extrabold">{t("dashboard.spending")}</h2>
          <div className="mt-4">
            <SpendingDonut data={data.spendingByBehavior} formatAmount={formatVND} />
          </div>
        </section>

        {data.budgetLines.length > 0 && (
          <section className="rounded-[15px] border border-border bg-card shadow-panel overflow-hidden">
            <h2 className="text-base font-extrabold px-7 pt-7 pb-3">{t("dashboard.budget")}</h2>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("budget.groupName")}</TableHead>
                    <TableHead className="text-right">{t("budget.spent")}</TableHead>
                    <TableHead className="text-right">{t("budget.allocated")}</TableHead>
                    <TableHead className="text-center w-[70px]">{t("budget.usagePercent")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.budgetLines.map((line: BudgetActualLine) => {
                    const usage = Math.round(line.usage_pct ?? 0)
                    return (
                      <TableRow key={line.cost_type_id}>
                        <TableCell className="text-sm font-medium">{line.cost_type_name}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-sm">{formatVND(line.actual_amount)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-sm text-muted-foreground">{formatVND(line.budget_amount)}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "text-xs font-medium",
                            usage > 100 ? "text-expense" : usage > 85 ? "text-orange-500" : "text-muted-foreground"
                          )}>
                            {usage}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            {/* Mobile: compact cards */}
            <div className="md:hidden px-4 pb-4 space-y-3">
              {data.budgetLines.map((line: BudgetActualLine) => (
                <div key={line.cost_type_id}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{line.cost_type_name}</span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {Math.round(line.usage_pct ?? 0)}%
                    </span>
                  </div>
                  <BudgetProgressBar percentage={line.usage_pct ?? 0} className="mt-2" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">{formatVND(line.actual_amount)}</span>
                    <span className="font-mono tabular-nums">{formatVND(line.budget_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Funds */}
      {data.funds.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-extrabold">{t("dashboard.funds")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.funds.map((fund) => (
              <FundOverviewCard key={fund.id} fund={fund} />
            ))}
          </div>
        </section>
      )}

      {/* Recent transactions */}
      <section>
        <h2 className="mb-3 text-base font-extrabold">{t("dashboard.recentTx")}</h2>
        <RecentTransactionsList transactions={data.recentTransactions} />
      </section>
    </div>
  )
}
