import { keys } from "@growbase/shared/queryKeys"
import type { BudgetActualLine } from "@growbase/shared/types/app"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

export function useBudget() {
  const user = useAppStore((s) => s.user)
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)
  const isLocked = useAppStore((s) => s.isLocked)

  return useQuery({
    queryKey: keys.budgetActuals(householdId ?? "", currentMonth),
    queryFn: () => apiFetch<BudgetActualLine[]>(`/api/budget?month=${currentMonth}`),
    enabled: !!user && !!householdId && !isLocked,
  })
}
