"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { DebtEntry } from "@growbase/shared/types/app"
import type { CreateDebtInput, UpdateDebtInput } from "@growbase/shared/schemas/debt"

export function useCreateDebt() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: CreateDebtInput): Promise<DebtEntry> => {
      const res = await fetch("/api/debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được khoản nợ")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.debts(householdId) })
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

export function useUpdateDebt() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateDebtInput): Promise<DebtEntry> => {
      const res = await fetch(`/api/debt/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được khoản nợ")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.debts(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetBaselines(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

type PaidOffResult = {
  debt: DebtEntry
  is_last_debt: boolean
}

export function usePaidOffDebt() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (id: string): Promise<PaidOffResult> => {
      const res = await fetch(`/api/debt/${id}/paid-off`, {
        method: "PATCH",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không thể đánh dấu đã trả hết")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.debts(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetBaselines(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetActuals(householdId, month) })
      }
      toast.success("Đã trả hết nợ!", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
