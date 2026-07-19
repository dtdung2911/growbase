import { keys } from "@growbase/shared/queryKeys"
import type { HouseholdSummary } from "@growbase/shared/types/app"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

export function useHouseholds() {
  const user = useAppStore((s) => s.user)
  const isLocked = useAppStore((s) => s.isLocked)
  return useQuery({
    queryKey: keys.households(),
    queryFn: () => apiFetch<HouseholdSummary[]>("/api/households"),
    enabled: !!user && !isLocked,
  })
}
