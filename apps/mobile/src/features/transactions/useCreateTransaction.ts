import { keys } from "@growbase/shared/queryKeys"
import type { CreateTransactionInput } from "@growbase/shared/schemas/transaction"
import { useMutation } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { queryClient } from "@/lib/query/queryClient"
import { useAppStore } from "@/store/appStore"

export type NewTransaction = Pick<
  CreateTransactionInput,
  | "amount"
  | "direction"
  | "transaction_type"
  | "category_id"
  | "account_id"
  | "description"
  | "transaction_date"
>

export function useCreateTransaction() {
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)
  return useMutation({
    mutationFn: (body: NewTransaction) =>
      apiFetch<{ id: string }>("/api/transactions", { method: "POST", body }),
    onSuccess: (_data, body) => {
      if (!householdId) return
      const months = new Set([currentMonth, body.transaction_date.slice(0, 7)])
      for (const month of months) {
        queryClient.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        queryClient.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
        queryClient.invalidateQueries({ queryKey: keys.budget(householdId, month) })
      }
      queryClient.invalidateQueries({ queryKey: keys.accounts(householdId) })
    },
  })
}
