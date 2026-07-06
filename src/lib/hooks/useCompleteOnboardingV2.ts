"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/stores/appStore"
import type { OnboardingGoal } from "@/lib/validations/onboardingV2"
import type { FeasibilityResult } from "@/lib/constants/budgetTemplate"

export interface CompleteOnboardingV2Response {
  householdId: string
  feasibility: FeasibilityResult
  todayRemaining: number
}

export const COMPLETE_ONBOARDING_V2_KEY = ["complete-onboarding-v2"]

export function useCompleteOnboardingV2() {
  const setHouseholdId = useAppStore((s) => s.setHouseholdId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: COMPLETE_ONBOARDING_V2_KEY,
    mutationFn: async (input: {
      goal: OnboardingGoal
      monthlyIncome: number
    }): Promise<CompleteOnboardingV2Response> => {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
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
