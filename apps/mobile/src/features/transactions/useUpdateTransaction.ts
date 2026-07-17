import { keys } from "@growbase/shared/queryKeys"
import type { UpdateTransactionInput } from "@growbase/shared/schemas/transaction"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: (input: UpdateTransactionInput) =>
      apiFetch<{ id: string }>(`/api/transactions/${input.id}`, {
        method: "PUT",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.transactions(householdId ?? "", currentMonth),
      })
      queryClient.invalidateQueries({ queryKey: keys.budget(householdId ?? "", currentMonth) })
      queryClient.invalidateQueries({ queryKey: keys.accounts(householdId ?? "") })
    },
  })
}
