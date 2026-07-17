import { keys } from "@growbase/shared/queryKeys"
import { createTransactionSchema, type CreateTransactionInput } from "@growbase/shared/schemas/transaction"
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/lib/query/queryClient"
import { enqueueAndSync } from "@/lib/sync/dispatch"
import { useAppStore } from "@/store/appStore"
import { mutateCache } from "./optimisticCache"

export function useCreateTransaction() {
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!householdId) throw new Error("Chưa chọn hộ gia đình")
      const body = createTransactionSchema.parse(input)
      const item = enqueueAndSync({
        householdId,
        kind: "create",
        path: "/api/transactions",
        method: "POST",
        body: { ...body },
      })
      await mutateCache(queryClient, keys.transactions(householdId, currentMonth), (rows) => [
        { ...body, id: item.id },
        ...rows,
      ])
      return item
    },
  })
}
