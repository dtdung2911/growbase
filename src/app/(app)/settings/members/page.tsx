"use client"

import { MembersManager } from "@/components/settings/MembersManager"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function MembersSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.members")}</h1>
      <MembersManager />
    </div>
  )
}
