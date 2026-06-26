"use client"

import { useCallback, useEffect, useState } from "react"
import { WizardLayout } from "@/components/onboarding/WizardLayout"
import { WizardStep1Type } from "@/components/onboarding/WizardStep1Type"
import { WizardStep2Invite } from "@/components/onboarding/WizardStep2Invite"
import { WizardStep3Income } from "@/components/onboarding/WizardStep3Income"
import { WizardStep4Accounts } from "@/components/onboarding/WizardStep4Accounts"
import { WizardStep5Debt } from "@/components/onboarding/WizardStep5Debt"
import { WizardStep6Categories } from "@/components/onboarding/WizardStep6Categories"
import { WizardStep7Budget } from "@/components/onboarding/WizardStep7Budget"
import { useWizardStore } from "@/lib/stores/wizardStore"
import { useAppStore } from "@/lib/stores/appStore"
import { useUpsertHousehold } from "@/lib/hooks/useHousehold"
import { useCompleteOnboarding } from "@/lib/hooks/useCompleteOnboarding"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Household } from "@/types/app"
import type { HouseholdInput } from "@/lib/validations/household"

interface SetupClientProps {
  initialHousehold: Household | null
  defaultName: string
}

export function SetupClient({ initialHousehold, defaultName }: SetupClientProps) {
  const { t } = useTranslation()
  const setHouseholdId = useAppStore((s) => s.setHouseholdId)
  const setHousehold = useWizardStore((s) => s.setHousehold)
  const reset = useWizardStore((s) => s.reset)

  const currentStep = useWizardStore((s) => s.currentStep)
  const stepOrder = useWizardStore((s) => s.stepOrder())
  const totalSteps = useWizardStore((s) => s.totalSteps())
  const canProceed = useWizardStore((s) => s.canProceed())
  const next = useWizardStore((s) => s.next)
  const prev = useWizardStore((s) => s.prev)

  const upsert = useUpsertHousehold()
  const complete = useCompleteOnboarding()

  const [step1Draft, setStep1Draft] = useState<HouseholdInput | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  // Hydrate store from server household (resume / refresh).
  // If no initial household, reset stale wizard state from localStorage.
  useEffect(() => {
    if (initialHousehold) {
      setHouseholdId(initialHousehold.id)
      setHousehold(
        initialHousehold.id,
        initialHousehold.household_type,
        initialHousehold.currency
      )
    } else {
      reset()
    }
  }, [initialHousehold, setHouseholdId, setHousehold, reset])

  const isLastStep = currentStep === stepOrder[stepOrder.length - 1]
  const stepIndex = stepOrder.indexOf(currentStep) + 1
  const isPending = upsert.isPending || complete.isPending

  const buildCompletePayload = useCallback(() => {
    const s = useWizardStore.getState()
    return {
      householdId: s.householdId!,
      incomes: s.incomes,
      accounts: s.accounts,
      debts: s.debts,
      budgetPcts: s.budgetPcts.map((b) => ({
        name: b.name,
        budgetPct: b.budgetPct,
        linkedCategoryGroupNames: b.linkedCategoryGroupNames,
      })),
    }
  }, [])

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
      if (!step1Draft) return
      try {
        await upsert.mutateAsync(step1Draft)
        next()
      } catch {
        // error toast handled by onError
      }
      return
    }
    if (isLastStep) {
      try {
        await complete.mutateAsync(buildCompletePayload())
      } catch {
        // error toast handled by onError
      }
      return
    }
    next()
  }, [
    currentStep,
    step1Draft,
    isLastStep,
    upsert,
    complete,
    next,
    buildCompletePayload,
  ])

  const handleSkip = useCallback(async () => {
    if (isLastStep) {
      try {
        await complete.mutateAsync(buildCompletePayload())
      } catch {
        // error toast handled by onError
      }
      return
    }
    next()
  }, [isLastStep, complete, next, buildCompletePayload])

  const showSkip = currentStep === 2 || currentStep === 5

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <WizardLayout
      currentStep={stepIndex}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrev={prev}
      onSkip={showSkip ? handleSkip : undefined}
      isPending={isPending}
      nextDisabled={!canProceed}
      nextLabel={isLastStep ? t("setup.complete") : t("setup.next")}
      showPrev={stepIndex > 1}
    >
      {currentStep === 1 && (
        <WizardStep1Type
          defaultName={defaultName}
          onDraftChange={setStep1Draft}
        />
      )}
      {currentStep === 2 && <WizardStep2Invite />}
      {currentStep === 3 && <WizardStep3Income />}
      {currentStep === 4 && <WizardStep4Accounts />}
      {currentStep === 5 && <WizardStep5Debt />}
      {currentStep === 6 && <WizardStep6Categories />}
      {currentStep === 7 && <WizardStep7Budget />}
    </WizardLayout>
  )
}
