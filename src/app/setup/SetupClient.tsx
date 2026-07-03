"use client"

import { useEffect, useState } from "react"
import { OnboardingV2Shell } from "@/components/onboarding/v2/OnboardingV2Shell"
import { HookStep } from "@/components/onboarding/v2/HookStep"
import { GoalStep } from "@/components/onboarding/v2/GoalStep"
import { IncomeStep } from "@/components/onboarding/v2/IncomeStep"
import { TadaStep } from "@/components/onboarding/v2/TadaStep"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"

// Onboarding v2 — 4 bước "mở quà": Hook → Mục tiêu → Thu nhập → Tada (PRD onboarding-v2 F1).
// Wizard 7 bước cũ ngắt khỏi render tại đây; components cũ xoá ở story 4.7.
export function SetupClient() {
  const step = useOnboardingV2Store((s) => s.step)

  // Chờ zustand persist hydrate từ sessionStorage — tránh nháy về step 0 khi reload
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <OnboardingV2Shell>
      {step === 0 && <HookStep />}
      {step === 1 && <GoalStep />}
      {step === 2 && <IncomeStep />}
      {step === 3 && <TadaStep />}
    </OnboardingV2Shell>
  )
}
