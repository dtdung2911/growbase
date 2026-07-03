"use client"

import { useTranslation } from "@/lib/i18n/useTranslation"

// Placeholder — màn Tada thật ở story 4.5
export function TadaStep() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-center">
      <p className="max-w-sm text-sm text-muted-foreground">{t("setupV2.tada.placeholder")}</p>
    </div>
  )
}
