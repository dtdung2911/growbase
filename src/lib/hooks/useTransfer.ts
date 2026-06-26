"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { CreateTransferInput } from "@/lib/validations/transaction"

export function useTransfer() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const res = await fetch("/api/transactions/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không chuyển khoản được")
      return json.data as { out_id: string; in_id: string }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.accounts(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budget(householdId, month) })
      }
      toast.success("Đã chuyển khoản", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
