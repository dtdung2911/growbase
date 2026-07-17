import { keys } from "@growbase/shared/queryKeys"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.transactions(householdId ?? "", currentMonth),
      })
      queryClient.invalidateQueries({ queryKey: keys.budget(householdId ?? "", currentMonth) })
    },
  })
}
