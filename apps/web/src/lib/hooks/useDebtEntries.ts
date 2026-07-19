"use client"

import { useQuery } from "@tanstack/react-query"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { DebtEntry } from "@growbase/shared/types/app"

export function useDebtEntries() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.debts(householdId ?? ""),
    queryFn: async (): Promise<DebtEntry[]> => {
      const res = await fetch("/api/debt")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được danh sách nợ")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}
