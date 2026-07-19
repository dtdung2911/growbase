import { keys } from "@growbase/shared/queryKeys"
import type { TransactionWithJoins } from "@growbase/shared/types/app"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

export function useTransactions() {
  const user = useAppStore((s) => s.user)
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)
  const isLocked = useAppStore((s) => s.isLocked)

  return useQuery({
    queryKey: keys.transactions(householdId ?? "", currentMonth),
    queryFn: () =>
      apiFetch<TransactionWithJoins[]>(`/api/transactions?month=${currentMonth}`),
    enabled: !!user && !!householdId && !isLocked,
  })
}
