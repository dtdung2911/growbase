"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type {
  CreateCostTypeInput,
  UpdateCostTypeInput,
} from "@growbase/shared/schemas/cost-type"

export type CostType = {
  id: string
  household_id: string | null
  code: string
  display_name: string
  display_name_vi: string
  sort_order: number
  is_system: boolean
}

export function useCostTypes() {
  const householdId = useAppStore((s) => s.householdId) ?? ""

  return useQuery({
    queryKey: keys.costTypes(householdId),
    queryFn: async (): Promise<CostType[]> => {
      const res = await fetch("/api/cost-types")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được loại chi phí")
      return json.data ?? []
    },
    staleTime: 24 * 60 * 60_000,
    enabled: Boolean(householdId),
  })
}

function useInvalidateCostTypes() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return () => {
    if (!householdId) return
    void qc.invalidateQueries({ queryKey: keys.costTypes(householdId) })
    void qc.invalidateQueries({ queryKey: keys.categories(householdId) })
  }
}

export function useCreateCostType() {
  const invalidate = useInvalidateCostTypes()

  return useMutation({
    mutationFn: async (input: CreateCostTypeInput) => {
      const res = await fetch("/api/cost-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được loại chi phí")
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useUpdateCostType() {
  const invalidate = useInvalidateCostTypes()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateCostTypeInput) => {
      const res = await fetch(`/api/cost-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được loại chi phí")
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useDeleteCostType() {
  const invalidate = useInvalidateCostTypes()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cost-types/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được loại chi phí")
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
