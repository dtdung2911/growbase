"use client"

import { useState } from "react"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { useTransactions } from "@/lib/hooks/useTransactions"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { TransactionList } from "@/components/transactions/TransactionList"
import { QuickAddSheet } from "@/components/transactions/QuickAddSheet"
import { EmptyState } from "@/components/shared/EmptyState"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"

export default function TransactionsPage() {
  const householdId = useAppStore((s) => s.householdId)
  const { t } = useTranslation()
  const { data: transactions, isLoading } = useTransactions()
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  if (!householdId) return null

  const headerActions = (
    <>
      <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
        <Link href="/transactions/import">
          <Icon icon="lucide:file-up" className="h-4 w-4" />
          {t("import.cta")}
        </Link>
      </Button>
      <Button size="sm" className="min-h-[44px] gap-1.5" onClick={() => setQuickAddOpen(true)}>
        <Icon icon="lucide:plus" className="h-4 w-4" />
        {t("tx.addTransaction")}
      </Button>
    </>
  )

  if (isLoading) {
    return (
      <div className="p-4">
        <PageHeader titleKey="nav.transactions" actions={headerActions} />
        <SkeletonList count={8} />
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4">
        <PageHeader titleKey="nav.transactions" actions={headerActions} />
        <EmptyState
          icon="lucide:arrow-left-right"
          title={t("tx.emptyTitle")}
          description={t("tx.emptyDesc")}
          ctaLabel={t("tx.addTransaction")}
          onCta={() => setQuickAddOpen(true)}
        />
        <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      </div>
    )
  }

  return (
    <div className="p-4">
      <PageHeader titleKey="nav.transactions" actions={headerActions} />
      <TransactionList transactions={transactions} />
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}
