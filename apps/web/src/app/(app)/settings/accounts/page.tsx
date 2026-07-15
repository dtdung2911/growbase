"use client"

import { AccountsManager } from "@/components/settings/AccountsManager"
import { PageHeader } from "@/components/shared/PageHeader"

export default function AccountsSettingsPage() {
  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        titleKey="settings.accounts"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <AccountsManager />
    </div>
  )
}
