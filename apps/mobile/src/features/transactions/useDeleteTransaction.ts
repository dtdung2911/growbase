import { keys } from "@growbase/shared/queryKeys"
import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/lib/query/queryClient"
import { enqueueAndSync } from "@/lib/sync/dispatch"
import { hasUnsyncedCreate } from "@/lib/sync/mutationQueue"
import { useAppStore } from "@/store/appStore"
import { mutateCache } from "./optimisticCache"

export function useDeleteTransaction() {
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (id: string) => {
      if (!householdId) throw new Error("Chưa chọn hộ gia đình")
      if (hasUnsyncedCreate(householdId, id)) {
        throw new Error("Giao dịch chưa đồng bộ xong, thử lại sau")
      }
      const item = enqueueAndSync({
        householdId,
        kind: "delete",
        path: `/api/transactions/${id}`,
        method: "DELETE",
      })
      await mutateCache(queryClient, keys.transactions(householdId, currentMonth), (rows) =>
        rows.filter((row) => row.id !== id)
      )
      return item
    },
  })
}
