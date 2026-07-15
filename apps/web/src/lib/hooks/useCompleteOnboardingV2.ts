"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { OnboardingGoal } from "@growbase/shared/schemas/onboardingV2"

export interface OnboardingFundResult {
  id: string
  name: string
  fundType: "emergency" | "goal"
  presetId: string
  targetAmount: number
}

export interface CompleteOnboardingV2Response {
  householdId: string
  funds: OnboardingFundResult[]
  todayRemaining: number
}

export const COMPLETE_ONBOARDING_V2_KEY = ["complete-onboarding-v2"]

export function useCompleteOnboardingV2() {
  const setHouseholdId = useAppStore((s) => s.setHouseholdId)
  const queryClient = useQueryClient()
  const { locale } = useTranslation()

  return useMutation({
    mutationKey: COMPLETE_ONBOARDING_V2_KEY,
    mutationFn: async (input: {
      goals: OnboardingGoal[]
      monthlyIncome: number
    }): Promise<CompleteOnboardingV2Response> => {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, locale }),
      })
      const json = await res.json()
      if (!res.ok) {
        const err = new Error(json.error ?? "Không khởi tạo được") as Error & { status?: number }
        err.status = res.status
        throw err
      }
      return json.data
    },
    onSuccess: (data) => {
      setHouseholdId(data.householdId)
      // Household vừa được tạo — mọi cache trước onboarding đều vô nghĩa
      queryClient.invalidateQueries()
    },
  })
}
