"use client"

import { useQuery } from "@tanstack/react-query"
import { keys } from "@growbase/shared/queryKeys"
import type { Household } from "@growbase/shared/types/app"

export function useHousehold(householdId: string) {
  return useQuery({
    queryKey: keys.household(householdId),
    queryFn: async (): Promise<Household | null> => {
      const res = await fetch("/api/household")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được hộ gia đình")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}
