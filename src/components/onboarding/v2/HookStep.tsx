"use client"

import { useTranslation } from "@/lib/i18n/useTranslation"

// Placeholder — dashboard demo "nhà Minnie" thật render ở story 4.6
export function HookStep() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-bold text-foreground">{t("setupV2.hook.title")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("setupV2.hook.placeholder")}</p>
    </div>
  )
}
