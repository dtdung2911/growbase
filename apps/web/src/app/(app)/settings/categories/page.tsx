"use client"

import { CategoriesManager } from "@/components/settings/CategoriesManager"
import { PageHeader } from "@/components/shared/PageHeader"

export default function CategoriesSettingsPage() {
  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        titleKey="settings.categories"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <CategoriesManager />
    </div>
  )
}
