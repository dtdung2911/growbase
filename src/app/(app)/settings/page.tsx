"use client"

import { SettingsMenu } from "@/components/settings/SettingsMenu"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.title")}</h1>
      <SettingsMenu />
    </div>
  )
}
