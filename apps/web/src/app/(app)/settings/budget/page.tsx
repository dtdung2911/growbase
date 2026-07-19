"use client"

import { BudgetBaselineManager } from "@/components/settings/BudgetBaselineManager"
import { PageHeader } from "@/components/shared/PageHeader"

export default function BudgetSettingsPage() {
  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        titleKey="settings.budget"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <BudgetBaselineManager />
    </div>
  )
}
