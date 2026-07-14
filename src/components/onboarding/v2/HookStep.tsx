"use client"

import { useMemo } from "react"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { DashboardView } from "@/components/dashboard/DashboardView"
import { WelcomeModal } from "@/components/onboarding/v2/WelcomeModal"
import { runDashboardTour } from "@/components/onboarding/v2/dashboardTour"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import {
  buildHookDemoData,
  HOOK_DEMO_MONTH,
  HOOK_DEMO_TODAY_REFERENCE,
} from "@/components/onboarding/v2/hookDemoData"

export function HookStep() {
  const { t, locale } = useTranslation()
  const welcomeSeen = useOnboardingV2Store((s) => s.welcomeSeen)
  const markWelcomeSeen = useOnboardingV2Store((s) => s.markWelcomeSeen)
  const next = useOnboardingV2Store((s) => s.next)

  const demoData = useMemo(() => buildHookDemoData(t, locale), [t, locale])

  function handleWelcomeClose() {
    markWelcomeSeen()
    // Chờ modal đóng animation xong mới phủ overlay tour, tránh 2 lớp overlay chồng nhau.
    // Guard step===0: user có thể bấm Next ở footer trong 260ms → khỏi phủ tour lên IncomeStep.
    window.setTimeout(() => {
      if (useOnboardingV2Store.getState().step === 0) runDashboardTour(t, next)
    }, 260)
  }

  return (
    <>
      <WelcomeModal open={!welcomeSeen} onClose={handleWelcomeClose} />
      <DashboardView
        data={demoData}
        month={HOOK_DEMO_MONTH}
        insightToday={HOOK_DEMO_TODAY_REFERENCE}
      />
    </>
  )
}
