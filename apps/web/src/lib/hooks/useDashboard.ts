"use client"

import { useQuery } from "@tanstack/react-query"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { DashboardData } from "@growbase/shared/types/app"

export function useDashboardData() {
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useQuery({
    queryKey: keys.dashboard(householdId ?? "", month),
    queryFn: async (): Promise<DashboardData> => {
      const res = await fetch(`/api/dashboard?month=${month}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được dữ liệu")
      return json.data
    },
    staleTime: 5 * 60_000,
    enabled: Boolean(householdId),
  })
}
