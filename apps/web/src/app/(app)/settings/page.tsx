"use client"

import { SettingsMenu } from "@/components/settings/SettingsMenu"
import { PageHeader } from "@/components/shared/PageHeader"

export default function SettingsPage() {
  return (
    <div className="space-y-4 pb-16">
      <PageHeader titleKey="nav.settings" />
      <SettingsMenu />
    </div>
  )
}
