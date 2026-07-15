"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import { recordActivityOnce } from "@/lib/hooks/useRecordActivity"
import type { TransactionWithJoins } from "@growbase/shared/types/app"
import type { CreateTransactionInput, UpdateTransactionInput } from "@growbase/shared/schemas/transaction"

export function useTransactions() {
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useQuery({
    queryKey: keys.transactions(householdId ?? "", month),
    queryFn: async (): Promise<TransactionWithJoins[]> => {
      const res = await fetch(`/api/transactions?month=${month}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được giao dịch")
      return json.data
    },
    staleTime: 60_000,
    enabled: Boolean(householdId),
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)
  const userId = useAppStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được giao dịch")
      return json.data as { id: string }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.budget(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.accounts(householdId) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
      }
      toast.success("Đã lưu", { duration: 2000 })
      // Ghi ngày ghi giao dịch cũng tính hoạt động dù không mở dashboard (Story 7.2)
      if (userId) void recordActivityOnce(userId).catch(() => {})
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: UpdateTransactionInput) => {
      const res = await fetch(`/api/transactions/${input.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được giao dịch")
      return json.data as { id: string }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.budget(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.accounts(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xoá được giao dịch")
      return json.data as { id: string }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.budget(householdId, month) })
      }
      toast.success("Đã xoá", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
