"use client"

import { useMemo } from "react"
import { useTranslation } from "@/lib/i18n/useTranslation";
import { DashboardView } from "@/components/dashboard/DashboardView"
import {
  buildHookDemoData,
  HOOK_DEMO_MONTH,
  HOOK_DEMO_TODAY_REFERENCE,
} from "@/components/onboarding/v2/hookDemoData"

export function HookStep() {
  const { t, locale } = useTranslation()

  const demoData = useMemo(() => buildHookDemoData(t, locale), [t, locale])

  return (
    <div className="space-y-4">
      <div className="rounded-[13px] border border-primary/30 bg-primary-soft px-4 py-3 text-center">
        <p className="text-sm font-medium text-primary">
          {t("setupV2.hook.banner")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("setupV2.hook.mindset")}
        </p>
      </div>

      <DashboardView
        data={demoData}
        month={HOOK_DEMO_MONTH}
        insightToday={HOOK_DEMO_TODAY_REFERENCE}
      />
    </div>
  );
}
