"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type {
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
} from "@/lib/validations/category-group"

export function useCreateCategoryGroup() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (input: CreateCategoryGroupInput) => {
      const res = await fetch("/api/category-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được nhóm")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.categories(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useUpdateCategoryGroup() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateCategoryGroupInput) => {
      const res = await fetch(`/api/category-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được nhóm")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.categories(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useDeleteCategoryGroup() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/category-groups/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được nhóm")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.categories(householdId) })
      }
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
