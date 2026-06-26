"use client"

import { HouseholdSettingsForm } from "@/components/settings/HouseholdSettingsForm"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function HouseholdSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.household")}</h1>
      <HouseholdSettingsForm />
    </div>
  )
}
