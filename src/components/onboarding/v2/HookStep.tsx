"use client"

import { useMemo } from "react"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import { calculateTodayRemaining } from "@/lib/constants/budgetTemplate"
import { DashboardView } from "@/components/dashboard/DashboardView"
import {
  buildHookDemoData,
  HOOK_DEMO_MONTH,
  HOOK_DEMO_MONTHLY_INCOME,
  HOOK_DEMO_TODAY_REFERENCE,
} from "@/components/onboarding/v2/hookDemoData"

export function HookStep() {
  const { t, locale } = useTranslation()

  const demoData = useMemo(() => buildHookDemoData(t, locale), [t, locale])
  const todayRemaining = useMemo(
    () => calculateTodayRemaining(HOOK_DEMO_MONTHLY_INCOME, HOOK_DEMO_TODAY_REFERENCE),
    []
  )

  return (
    <div className="space-y-4">
      <div className="rounded-[13px] border border-primary/30 bg-primary-soft px-4 py-3 text-center">
        <p className="text-sm font-medium text-primary">{t("setupV2.hook.banner")}</p>
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">{t("setupV2.hook.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("setupV2.hook.insight", { amount: formatVND(todayRemaining) })}
        </p>
      </div>

      <DashboardView data={demoData} month={HOOK_DEMO_MONTH} />
    </div>
  )
}
