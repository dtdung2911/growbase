"use client"

import { BudgetBaselineManager } from "@/components/settings/BudgetBaselineManager"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function BudgetSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.budget")}</h1>
      <BudgetBaselineManager />
    </div>
  )
}
