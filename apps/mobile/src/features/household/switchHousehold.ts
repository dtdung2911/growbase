import { purgeQueryCache } from "@/lib/query/queryClient"
import { useAppStore } from "@/store/appStore"

export async function switchHousehold(id: string): Promise<void> {
  if (id === useAppStore.getState().householdId) return
  useAppStore.getState().setSwitchingHousehold(true)
  try {
    // Purge before flipping householdId so the new household never reads stale data.
    await purgeQueryCache()
    useAppStore.getState().setHouseholdId(id)
  } finally {
    useAppStore.getState().setSwitchingHousehold(false)
  }
}
