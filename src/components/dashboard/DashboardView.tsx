"use client"

import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import { MetricCard } from "@/components/shared/MetricCard"
import { SpendingDonut } from "@/components/shared/SpendingDonut"
import { BudgetProgressBar } from "@/components/shared/BudgetProgressBar"
import { toYearMonth } from "@/lib/utils/date"
import { FundOverviewCard } from "@/components/dashboard/FundOverviewCard"
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList"
import { IncomeExpenseBar, WeekdayChart, TopExpensesWidget } from "@/components/dashboard/DashboardCharts"
import { FirstExpenseCta } from "@/components/dashboard/FirstExpenseCta"
import { DailyInsightBanner } from "@/components/dashboard/DailyInsightBanner"
import { MilestoneCelebration } from "@/components/dashboard/MilestoneCelebrationDialog"
import { InviteCompanionPrompt } from "@/components/dashboard/InviteCompanionPrompt"
import { StageBadge } from "@/components/dashboard/StageBadge"
import { StageEventCard } from "@/components/dashboard/StageEventCard"
import type { BudgetActualLine, DashboardData } from "@/types/app"

function trendPct(current: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((current - prev) / prev) * 1000) / 10
}

// Component thuần render — dùng chung cho /dashboard thật và demo "nhà Minnie" (story 4.6)
// insightToday: demo pin "hôm nay" vào tháng demo; app thật bỏ trống → chỉ hiện
// insight khi đang xem đúng tháng hiện tại (xem tháng khác thì "còn lại hôm nay" vô nghĩa)
export function DashboardView({
  data,
  month,
  insightToday,
}: {
  data: DashboardData
  month: string
  insightToday?: Date
}) {
  const { t } = useTranslation()
  const showInsight =
    data.hasAnyTransactionEver && (insightToday != null || month === toYearMonth(new Date()))

  const incomeDelta = trendPct(data.totalIncome, data.lastMonthIncome)
  const expenseDelta = trendPct(data.totalExpense, data.lastMonthExpense)
  const dayZeroEmptyMessage = !data.hasAnyTransactionEver ? t("dashboard.dayZeroEmptyHint") : undefined

  return (
    <div className="space-y-6">
      <StageBadge />
      <StageEventCard />
      <MilestoneCelebration funds={data.funds} />

      {/* Daily insight / first-expense CTA */}
      {showInsight && <DailyInsightBanner data={data} today={insightToday} />}
      {!data.hasAnyTransactionEver && <FirstExpenseCta />}
      <InviteCompanionPrompt activeDaysLast7={data.activeDaysLast7} />

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <MetricCard
          label={t("dashboard.income")}
          amount={data.totalIncome}
          formatAmount={formatVND}
          trend="up"
          trendPct={incomeDelta}
          icon="lucide:trending-up"
          variant="income"
        />
        <MetricCard
          label={t("dashboard.expense")}
          amount={data.totalExpense}
          formatAmount={formatVND}
          trend="down"
          trendPct={expenseDelta !== null ? -expenseDelta : null}
          icon="lucide:trending-down"
          variant="expense"
        />
        <MetricCard
          label={t("dashboard.savings")}
          amount={data.fundContributions}
          formatAmount={formatVND}
          trend="up"
          icon="lucide:piggy-bank"
        />
        <MetricCard
          label={
            data.netWorth !== null
              ? t("dashboard.netWorth")
              : t("dashboard.savingsRate")
          }
          amount={data.netWorth !== null ? data.netWorth : data.savingsRate}
          formatAmount={data.netWorth !== null ? formatVND : (n) => `${n}%`}
          trend={data.savingsRate >= 0 ? "up" : "down"}
          icon={data.netWorth !== null ? "lucide:landmark" : "lucide:percent"}
        />
      </div>

      {/* Income vs Expense bar chart + Spending donut */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
          <h2 className="mb-1 text-sm font-semibold">
            {t("dashboard.incomeVsExpense")}
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("dashboard.vsLastMonth")}
          </p>
          <IncomeExpenseBar
            income={data.totalIncome}
            expense={data.totalExpense}
            lastIncome={data.lastMonthIncome}
            lastExpense={data.lastMonthExpense}
            month={month}
          />
        </section>

        <section className="rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">
            {t("dashboard.spending")}
          </h2>
          <SpendingDonut
            data={data.spendingByBehavior}
            formatAmount={formatVND}
            emptyMessage={dayZeroEmptyMessage}
          />
        </section>
      </div>

      {/* Top expense categories + Weekday spending */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold">
            {t("dashboard.topExpenses")}
          </h2>
          <TopExpensesWidget
            categories={data.topExpenseCategories}
            totalExpense={data.totalExpense}
            emptyMessage={dayZeroEmptyMessage}
          />
        </section>

        <section className="rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">
            {t("dashboard.weekdaySpending")}
          </h2>
          <WeekdayChart data={data.weekdaySpending} />
        </section>
      </div>

      {/* Budget */}
      {data.budgetLines.length > 0 && (
        <section className="overflow-hidden rounded-[13px] border border-border/40 bg-card shadow-card">
          <h2 className="px-5 pb-3 pt-5 text-sm font-semibold">
            {t("dashboard.budget")}
          </h2>
          {/* Card-style flat list — cùng UI mọi breakpoint, 2 cột trên desktop */}
          <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-2 md:gap-x-8">
            {data.budgetLines.map((line: BudgetActualLine) => (
              <div key={line.cost_type_id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {line.cost_type_name}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {Math.round(line.usage_pct ?? 0)}%
                  </span>
                </div>
                <BudgetProgressBar
                  percentage={line.usage_pct ?? 0}
                  className="mt-2"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {formatVND(line.actual_amount)}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatVND(line.budget_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Funds */}
      {data.funds.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">{t("dashboard.funds")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.funds.map((fund) => (
              <FundOverviewCard key={fund.id} fund={fund} />
            ))}
          </div>
        </section>
      )}

      {/* Recent transactions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">
          {t("dashboard.recentTx")}
        </h2>
        <RecentTransactionsList
          transactions={data.recentTransactions}
          emptyMessage={dayZeroEmptyMessage}
        />
      </section>
    </div>
  );
}
