"use client"

import { useFunds } from "@/lib/hooks/useFunds"
import { useAppStore } from "@/lib/stores/appStore"
import { FundList } from "@/components/funds/FundList"
import { MonthlyBufferBanner } from "@/components/funds/MonthlyBufferBanner"
import { SkeletonCard } from "@/components/shared/SkeletonCard"
import { PageHeader } from "@/components/shared/PageHeader"

export default function FundsPage() {
  const householdId = useAppStore((s) => s.householdId)
  const { data: funds, isLoading } = useFunds()

  if (!householdId) return null

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 pb-16">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const list = funds ?? []
  const bufferFund = list.find((f) => f.fund_type === "freedom" && f.reset_monthly)

  return (
    <div className="space-y-4 p-4 pb-16">
      <PageHeader titleKey="nav.funds" />
      {bufferFund && <MonthlyBufferBanner fund={bufferFund} />}
      <FundList funds={list} />
    </div>
  )
}
