"use client"

import { AccountsManager } from "@/components/settings/AccountsManager"
import { useTranslation } from "@/lib/i18n/useTranslation"

export default function AccountsSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t("settings.accounts")}</h1>
      <AccountsManager />
    </div>
  )
}
