"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { goalSchema, type OnboardingGoal } from "@/lib/validations/onboardingV2"

// Flow 4 bước: 0 Hook → 1 Mục tiêu → 2 Thu nhập → 3 Tada
export const ONBOARDING_V2_TOTAL_STEPS = 4

interface OnboardingV2State {
  step: number
  goal: OnboardingGoal | null
  monthlyIncome: number | null
  setGoal: (goal: OnboardingGoal | null) => void
  setMonthlyIncome: (amount: number | null) => void
  next: () => void
  prev: () => void
  reset: () => void
  canProceed: () => boolean
}

const initialState = { step: 0, goal: null, monthlyIncome: null }

export const useOnboardingV2Store = create<OnboardingV2State>()(
  persist(
    (set, get) => ({
      ...initialState,
      setGoal: (goal) => set({ goal }),
      setMonthlyIncome: (monthlyIncome) => set({ monthlyIncome }),
      next: () =>
        set((s) => ({ step: Math.min(s.step + 1, ONBOARDING_V2_TOTAL_STEPS - 1) })),
      prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
      reset: () => set(initialState),
      canProceed: () => {
        const s = get()
        if (s.step === 0) return true
        if (s.step === 1) return s.goal !== null && goalSchema.safeParse(s.goal).success
        if (s.step === 2) return s.monthlyIncome !== null && s.monthlyIncome > 0
        return false
      },
    }),
    {
      name: "growbase-onboarding-v2",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
