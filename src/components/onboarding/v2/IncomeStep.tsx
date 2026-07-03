"use client"

import { useTranslation } from "@/lib/i18n/useTranslation"

// Placeholder — màn Thu nhập thật ở story 4.3
export function IncomeStep() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-center">
      <p className="max-w-sm text-sm text-muted-foreground">{t("setupV2.income.placeholder")}</p>
    </div>
  )
}
