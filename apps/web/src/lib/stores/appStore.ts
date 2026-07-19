import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@growbase/shared/types/app"
import { toYearMonth } from "@growbase/shared/rules/date"

export type HouseholdSummary = {
  id: string
  name: string
  role: "owner" | "member"
}

interface AppStore {
  householdId: string | null
  allHouseholds: HouseholdSummary[]
  currentMonth: string
  user: User | null
  setCurrentMonth: (month: string) => void
  setHouseholdId: (id: string | null) => void
  setAllHouseholds: (households: HouseholdSummary[]) => void
  setUser: (user: User | null) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      householdId: null,
      allHouseholds: [],
      currentMonth: toYearMonth(),
      user: null,
      setCurrentMonth: (month) => set({ currentMonth: month }),
      setHouseholdId: (id) => set({ householdId: id }),
      setAllHouseholds: (households) => set({ allHouseholds: households }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "growbase-workspace",
      partialize: (state) => ({ householdId: state.householdId }),
    }
  )
)
