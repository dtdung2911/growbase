import { create } from "zustand"
import type { User } from "@/types/app"
import { toYearMonth } from "@/lib/utils/date"

interface AppStore {
  householdId: string | null
  currentMonth: string
  user: User | null
  setCurrentMonth: (month: string) => void
  setHouseholdId: (id: string) => void
  setUser: (user: User | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  householdId: null,
  currentMonth: toYearMonth(),
  user: null,
  setCurrentMonth: (month) => set({ currentMonth: month }),
  setHouseholdId: (id) => set({ householdId: id }),
  setUser: (user) => set({ user }),
}))
