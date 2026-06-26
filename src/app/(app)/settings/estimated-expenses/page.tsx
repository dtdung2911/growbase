"use client"

import { EstimatedExpenseManager } from "@/components/settings/EstimatedExpenseManager"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function EstimatedExpensesSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.estimatedExpenses")}</h1>
      <EstimatedExpenseManager />
    </div>
  )
}
