"use client"

import { EstimatedExpenseManager } from "@/components/settings/EstimatedExpenseManager"
import { PageHeader } from "@/components/shared/PageHeader"

export default function EstimatedExpensesSettingsPage() {
  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        titleKey="settings.estimatedExpenses"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <EstimatedExpenseManager />
    </div>
  )
}
