"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { EstimatedExpense } from "@/types/app"
import type {
  CreateEstimatedExpenseInput,
  UpdateEstimatedExpenseInput,
} from "@/lib/validations/estimated-expense"

export function useEstimatedExpenses() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.estimatedExpenses(householdId ?? ""),
    queryFn: async (): Promise<EstimatedExpense[]> => {
      const res = await fetch("/api/estimated-expenses")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được chi phí dự kiến")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useCreateEstimatedExpense() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (input: CreateEstimatedExpenseInput): Promise<EstimatedExpense> => {
      const res = await fetch("/api/estimated-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được chi phí dự kiến")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.estimatedExpenses(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useUpdateEstimatedExpense() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & UpdateEstimatedExpenseInput): Promise<EstimatedExpense> => {
      const res = await fetch(`/api/estimated-expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được chi phí dự kiến")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.estimatedExpenses(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useDeleteEstimatedExpense() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/estimated-expenses/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được chi phí dự kiến")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.estimatedExpenses(householdId) })
      }
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
