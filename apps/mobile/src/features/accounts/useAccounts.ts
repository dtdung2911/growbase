import { keys } from "@growbase/shared/queryKeys"
import type { Account } from "@growbase/shared/types/app"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

export function useAccounts() {
  const householdId = useAppStore((s) => s.householdId)
  const isLocked = useAppStore((s) => s.isLocked)
  return useQuery({
    queryKey: keys.accounts(householdId ?? ""),
    queryFn: () => apiFetch<Account[]>("/api/accounts"),
    enabled: !!householdId && !isLocked,
  })
}
