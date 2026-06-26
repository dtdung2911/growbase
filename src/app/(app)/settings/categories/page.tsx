"use client"

import { CategoriesManager } from "@/components/settings/CategoriesManager"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function CategoriesSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.categories")}</h1>
      <CategoriesManager />
    </div>
  )
}
