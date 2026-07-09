"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { goalSchema, monthlyIncomeSchema, type OnboardingGoal } from "@/lib/validations/onboardingV2"

// Flow 4 bước: 0 Hook → 1 Mục tiêu → 2 Thu nhập → 3 Tada
export const ONBOARDING_V2_TOTAL_STEPS = 4

interface OnboardingV2State {
  step: number
  goals: OnboardingGoal[]
  monthlyIncome: number | null
  toggleGoal: (goal: OnboardingGoal) => void
  updateGoal: (presetId: OnboardingGoal["presetId"], patch: Partial<OnboardingGoal>) => void
  clearGoals: () => void
  setMonthlyIncome: (amount: number | null) => void
  next: () => void
  prev: () => void
  reset: () => void
  canProceed: () => boolean
}

const initialState = { step: 0, goals: [] as OnboardingGoal[], monthlyIncome: null }

export const useOnboardingV2Store = create<OnboardingV2State>()(
  persist(
    (set, get) => ({
      ...initialState,
      toggleGoal: (goal) =>
        set((s) => ({
          goals: s.goals.some((g) => g.presetId === goal.presetId)
            ? s.goals.filter((g) => g.presetId !== goal.presetId)
            : [...s.goals, goal],
        })),
      updateGoal: (presetId, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.presetId === presetId ? { ...g, ...patch } : g)),
        })),
      clearGoals: () => set({ goals: [] }),
      setMonthlyIncome: (monthlyIncome) => set({ monthlyIncome }),
      next: () =>
        set((s) => ({ step: Math.min(s.step + 1, ONBOARDING_V2_TOTAL_STEPS - 1) })),
      prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
      reset: () => set(initialState),
      canProceed: () => {
        const s = get()
        if (s.step === 0) return true
        // goals rỗng = chỉ quỹ khẩn cấp (implicit) → luôn đi tiếp được; có goals thì tất cả phải hợp lệ
        if (s.step === 1) return s.goals.every((g) => goalSchema.safeParse(g).success)
        if (s.step === 2) return monthlyIncomeSchema.safeParse(s.monthlyIncome).success
        return false
      },
    }),
    {
      name: "growbase-onboarding-v2",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      // v0 có shape `goal` object đơn — không map sạch sang mảng; onboarding chưa xong nên reset an toàn nhất
      migrate: (persisted, version) =>
        (version === 0 ? initialState : persisted) as unknown as OnboardingV2State,
    }
  )
)
