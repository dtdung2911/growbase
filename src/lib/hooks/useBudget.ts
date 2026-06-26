"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { BudgetActualLine, BudgetOverride } from "@/types/app"
import type { BudgetOverrideInput, BudgetOverrideDeleteInput } from "@/lib/validations/budget"

export function useBudgetActuals() {
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useQuery({
    queryKey: keys.budgetActuals(householdId ?? "", month),
    queryFn: async (): Promise<BudgetActualLine[]> => {
      const res = await fetch(`/api/budget?month=${month}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được ngân sách")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useBudgetOverrideMutation() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: BudgetOverrideInput): Promise<BudgetOverride> => {
      const res = await fetch("/api/budget/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không lưu được điều chỉnh")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
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

export function useDeleteBudgetOverride() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: BudgetOverrideDeleteInput): Promise<void> => {
      const res = await fetch("/api/budget/override", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được điều chỉnh")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.budgetActuals(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.budget(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
      }
      toast.success("Đã đặt lại mặc định", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
