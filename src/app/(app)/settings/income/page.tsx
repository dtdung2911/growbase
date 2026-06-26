"use client"

import { IncomeManager } from "@/components/settings/IncomeManager"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function IncomeSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.income")}</h1>
      <IncomeManager />
    </div>
  )
}
