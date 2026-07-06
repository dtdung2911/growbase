"use client"

import { useState } from "react"
import { useDashboardData } from "@/lib/hooks/useDashboard"
import { useTransactionReminder } from "@/lib/hooks/useTransactionReminder"
import { SkeletonCard } from "@/components/shared/SkeletonCard"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionReminder } from "@/components/shared/TransactionReminder"
import { QuickAddSheet } from "@/components/transactions/QuickAddSheet"
import { useAppStore } from "@/lib/stores/appStore"
import { PageHeader } from "@/components/shared/PageHeader"
import { DashboardView } from "@/components/dashboard/DashboardView"

export function DashboardClient() {
  const { data, isLoading } = useDashboardData()
  const { showReminder, dismiss } = useTransactionReminder()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const month = useAppStore((s) => s.currentMonth)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[62px] rounded-[18px]" />
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonList />
      </div>
    );
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <PageHeader titleKey="nav.dashboard" />
      {showReminder && (
        <TransactionReminder
          onAdd={() => setQuickAddOpen(true)}
          onDismiss={dismiss}
        />
      )}

      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      <DashboardView data={data} month={month} />
    </div>
  )
}
