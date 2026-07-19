import type { HouseholdSummary } from "@growbase/shared/types/app"
import { toYearMonth } from "@growbase/shared/rules/date"
import type { User } from "@supabase/supabase-js"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { appStorage } from "@/lib/storage/mmkv"

type AppState = {
  householdId: string | null
  currentMonth: string
  user: User | null
  isLocked: boolean
  allHouseholds: HouseholdSummary[]
  isSwitchingHousehold: boolean
  setUser: (user: User) => void
  clearUser: () => void
  lock: () => void
  unlock: () => void
  setHouseholdId: (id: string | null) => void
  setCurrentMonth: (month: string) => void
  setAllHouseholds: (households: HouseholdSummary[]) => void
  setSwitchingHousehold: (value: boolean) => void
  reset: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      householdId: null,
      currentMonth: toYearMonth(),
      user: null,
      // Starts locked every process launch so a cold start is never silently unlocked.
      isLocked: true,
      allHouseholds: [],
      isSwitchingHousehold: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null, householdId: null }),
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
      setHouseholdId: (id) => set({ householdId: id }),
      setCurrentMonth: (month) => set({ currentMonth: month }),
      setAllHouseholds: (households) => set({ allHouseholds: households }),
      setSwitchingHousehold: (value) => set({ isSwitchingHousehold: value }),
      reset: () =>
        set({
          user: null,
          householdId: null,
          currentMonth: toYearMonth(),
          allHouseholds: [],
          isSwitchingHousehold: false,
        }),
    }),
    {
      name: "growbase-workspace",
      storage: createJSONStorage(() => appStorage),
      // Only householdId survives a restart; user/session/isLocked never persist.
      partialize: (state) => ({ householdId: state.householdId }),
    }
  )
)
