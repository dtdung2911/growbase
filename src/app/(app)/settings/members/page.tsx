"use client"

import { MembersManager } from "@/components/settings/MembersManager"
import { PageHeader } from "@/components/shared/PageHeader"

export default function MembersSettingsPage() {
  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        titleKey="settings.members"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <MembersManager />
    </div>
  )
}
