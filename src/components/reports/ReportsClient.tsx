"use client"

import { useTranslation } from "@/lib/i18n/useTranslation"
import { useBudgetActuals } from "@/lib/hooks/useBudget"
import { useTransactions } from "@/lib/hooks/useTransactions"
import { useFunds } from "@/lib/hooks/useFunds"
import { useCategories } from "@/lib/hooks/useCategories"
import { useMonthlyReport } from "@/lib/hooks/useMonthlyReport"
import { useAppStore } from "@/lib/stores/appStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/reports/OverviewTab"
import { SpendingTab } from "@/components/reports/SpendingTab"
import { IncomeTab } from "@/components/reports/IncomeTab"
import { BudgetVsActualTab } from "@/components/reports/BudgetVsActualTab"
import { FundReportTab } from "@/components/reports/FundReportTab"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { PageHeader } from "@/components/shared/PageHeader"

export function ReportsClient() {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const txQuery = useTransactions()
  const budgetQuery = useBudgetActuals()
  const fundsQuery = useFunds()
  const categoriesQuery = useCategories(householdId ?? "")
  const monthlyQuery = useMonthlyReport(6)

  const isLoading =
    txQuery.isLoading ||
    budgetQuery.isLoading ||
    fundsQuery.isLoading ||
    monthlyQuery.isLoading

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <SkeletonList />
      </div>
    )
  }

  const transactions = txQuery.data ?? []
  const budgetLines = budgetQuery.data ?? []
  const funds = fundsQuery.data ?? []
  const categoryGroups = categoriesQuery.data ?? []
  const monthlySummary = monthlyQuery.data ?? []

  return (
    <div className="p-4">
      <PageHeader titleKey="nav.reports" />
      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1 text-xs">
            {t("reports.overview")}
          </TabsTrigger>
          <TabsTrigger value="spending" className="flex-1 text-xs">
            {t("reports.spending")}
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-1 text-xs">
            {t("reports.income")}
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex-1 text-xs">
            {t("reports.budgetVsActual")}
          </TabsTrigger>
          <TabsTrigger value="funds" className="flex-1 text-xs">
            {t("reports.funds")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab data={monthlySummary} />
        </TabsContent>
        <TabsContent value="spending" className="mt-4">
          <SpendingTab transactions={transactions} categoryGroups={categoryGroups} />
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <IncomeTab transactions={transactions} />
        </TabsContent>
        <TabsContent value="budget" className="mt-4">
          <BudgetVsActualTab budgetLines={budgetLines} />
        </TabsContent>
        <TabsContent value="funds" className="mt-4">
          <FundReportTab funds={funds} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
