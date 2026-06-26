"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"

export type ImportRow = {
  transaction_date: string
  amount: number
  direction: "in" | "out"
  description?: string
  category_id?: string
  account_id: string
  transaction_type: "income" | "expense"
}

export type ImportResult = { inserted: number; duplicates: number }

export function useImportTransactions() {
  const queryClient = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const currentMonth = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (rows: ImportRow[]): Promise<ImportResult> => {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Import thất bại")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        queryClient.invalidateQueries({
          queryKey: keys.transactions(householdId, currentMonth),
        })
      }
    },
  })
}
