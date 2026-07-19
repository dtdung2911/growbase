import type { HouseholdSummary } from "@growbase/shared/types/app"
import { useEffect } from "react"
import { purgeQueryCache } from "@/lib/query/queryClient"
import { useAppStore } from "@/store/appStore"
import { useHouseholds } from "@/features/household/useHouseholds"

export function pickDefaultHousehold(
  persistedId: string | null,
  households: HouseholdSummary[]
): string | null {
  if (households.length === 0) return null
  if (persistedId && households.some((h) => h.id === persistedId)) return persistedId
  return households[0].id
}

export function useHouseholdBootstrap(): void {
  const { data } = useHouseholds()
  const setAllHouseholds = useAppStore((s) => s.setAllHouseholds)
  const setHouseholdId = useAppStore((s) => s.setHouseholdId)

  useEffect(() => {
    // A failed/pending fetch leaves the existing context untouched.
    if (!data) return
    setAllHouseholds(data)
    const current = useAppStore.getState().householdId
    const next = pickDefaultHousehold(current, data)
    if (next === current) return
    // Replacing a stale/revoked persisted household with a different one must not
    // leak the old household's cached data (AD-M9): purge before switching.
    if (current) {
      void purgeQueryCache()
        .then(() => setHouseholdId(next))
        .catch(() => {
          // Purge failed: keep the current household rather than switch without a
          // successful purge, which would let `next` read the stale persisted cache
          // (AD-M9). Mirrors switchHousehold's no-half-switch-on-error semantics.
        })
    } else {
      setHouseholdId(next)
    }
  }, [data, setAllHouseholds, setHouseholdId])
}
