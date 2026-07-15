"use client"

import { IncomeManager } from "@/components/settings/IncomeManager"
import { PageHeader } from "@/components/shared/PageHeader"

export default function IncomeSettingsPage() {
  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        titleKey="settings.income"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <IncomeManager />
    </div>
  )
}
