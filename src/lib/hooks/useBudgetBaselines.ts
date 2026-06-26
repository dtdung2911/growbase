"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { BudgetBaseline } from "@/types/app"
import type {
  BatchUpdateBaselinesInput,
  CreateCustomBaselineInput,
} from "@/lib/validations/budget-baseline"

export function useBudgetBaselines() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.budgetBaselines(householdId ?? ""),
    queryFn: async (): Promise<BudgetBaseline[]> => {
      const res = await fetch("/api/budget/baselines")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được phân bổ ngân sách")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useBatchUpdateBaselines() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: BatchUpdateBaselinesInput): Promise<BudgetBaseline[]> => {
      const res = await fetch("/api/budget/baselines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được phân bổ")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.budgetBaselines(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetActuals(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.budget(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useCreateCustomBaseline() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: CreateCustomBaselineInput): Promise<BudgetBaseline> => {
      const res = await fetch("/api/budget/baselines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được dòng ngân sách")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.budgetBaselines(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetActuals(householdId, month) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useDeleteCustomBaseline() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budget/baselines/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được dòng ngân sách")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.budgetBaselines(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetActuals(householdId, month) })
      }
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
