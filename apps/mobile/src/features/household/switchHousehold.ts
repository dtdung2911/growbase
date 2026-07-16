import { purgeQueryCache } from "@/lib/query/queryClient"
import { useAppStore } from "@/store/appStore"

export async function switchHousehold(id: string): Promise<void> {
  const state = useAppStore.getState()
  if (state.isSwitchingHousehold) return // guard double-tap
  if (id === state.householdId) return
  if (!state.allHouseholds.some((h) => h.id === id)) return // stale/invalid id
  useAppStore.getState().setSwitchingHousehold(true)
  try {
    // Purge before flipping householdId so the new household never reads stale data.
    await purgeQueryCache()
    useAppStore.getState().setHouseholdId(id)
  } finally {
    useAppStore.getState().setSwitchingHousehold(false)
  }
}
