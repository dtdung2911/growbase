"use client"

import { DebtManager } from "@/components/settings/DebtManager"
import { PageHeader } from "@/components/shared/PageHeader"

export default function DebtSettingsPage() {
  return (
    <div className="space-y-4 p-4 pb-16">
      <PageHeader
        titleKey="settings.debt"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <DebtManager />
    </div>
  )
}
