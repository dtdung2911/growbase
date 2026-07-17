import { keys } from "@growbase/shared/queryKeys"
import { updateTransactionSchema, type UpdateTransactionInput } from "@growbase/shared/schemas/transaction"
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/lib/query/queryClient"
import { enqueueAndSync } from "@/lib/sync/dispatch"
import { hasUnsyncedCreate } from "@/lib/sync/mutationQueue"
import { useAppStore } from "@/store/appStore"
import { mutateCache } from "./optimisticCache"

export function useUpdateTransaction() {
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: UpdateTransactionInput) => {
      if (!householdId) throw new Error("Chưa chọn hộ gia đình")
      const body = updateTransactionSchema.parse(input)
      if (hasUnsyncedCreate(householdId, body.id)) {
        throw new Error("Giao dịch chưa đồng bộ xong, thử lại sau")
      }
      const item = enqueueAndSync({
        householdId,
        kind: "update",
        path: `/api/transactions/${body.id}`,
        method: "PUT",
        body: { ...body },
      })
      await mutateCache(queryClient, keys.transactions(householdId, currentMonth), (rows) =>
        rows.map((row) => (row.id === body.id ? { ...row, ...body } : row))
      )
      return item
    },
  })
}
