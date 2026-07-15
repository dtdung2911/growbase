"use client"

import { useQuery } from "@tanstack/react-query"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { Account } from "@growbase/shared/types/app"

export function useAccounts() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.accounts(householdId ?? ""),
    queryFn: async (): Promise<Account[]> => {
      const res = await fetch("/api/accounts")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được tài khoản")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}
