"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { IncomeSource } from "@growbase/shared/types/app"
import type {
  CreateIncomeSourceInput,
  UpdateIncomeSourceInput,
} from "@growbase/shared/schemas/income-source"

type IncomeSourcesResponse = {
  current: IncomeSource[]
  history: IncomeSource[]
}

export function useIncomeSources() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.incomeSources(householdId ?? ""),
    queryFn: async (): Promise<IncomeSourcesResponse> => {
      const res = await fetch("/api/income-sources")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được nguồn thu nhập")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useCreateIncomeSource() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (input: CreateIncomeSourceInput): Promise<IncomeSource> => {
      const res = await fetch("/api/income-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được nguồn thu nhập")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.incomeSources(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetBaselines(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useUpdateIncomeSource() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & UpdateIncomeSourceInput): Promise<IncomeSource> => {
      const res = await fetch(`/api/income-sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được nguồn thu nhập")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.incomeSources(householdId) })
        void qc.invalidateQueries({ queryKey: keys.budgetBaselines(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
