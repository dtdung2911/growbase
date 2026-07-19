"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type {
  EventBudget,
  EventBudgetWithItems,
  EventBudgetItem,
} from "@growbase/shared/types/app"
import type {
  CreateEventBudgetInput,
  UpdateEventBudgetInput,
  CreateEventBudgetItemInput,
  UpdateEventBudgetItemInput,
} from "@growbase/shared/schemas/event-budget"

export function useEventBudgets() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.eventBudgets(householdId ?? ""),
    queryFn: async (): Promise<EventBudget[]> => {
      const res = await fetch("/api/event-budgets")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được danh sách sự kiện")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useEventBudget(id: string) {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.eventBudget(householdId ?? "", id),
    queryFn: async (): Promise<EventBudgetWithItems> => {
      const res = await fetch(`/api/event-budgets/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được sự kiện")
      return json.data
    },
    enabled: Boolean(householdId) && Boolean(id),
  })
}

export function useCreateEventBudget() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (input: CreateEventBudgetInput): Promise<EventBudget> => {
      const res = await fetch("/api/event-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được sự kiện")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.eventBudgets(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })
}

export function useUpdateEventBudget() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & UpdateEventBudgetInput): Promise<EventBudget> => {
      const res = await fetch(`/api/event-budgets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được sự kiện")
      return json.data
    },
    onSuccess: (data) => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.eventBudgets(householdId) })
        void qc.invalidateQueries({ queryKey: keys.eventBudget(householdId, data.id) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })
}

export function useDeleteEventBudget() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/event-budgets/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được sự kiện")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.eventBudgets(householdId) })
      }
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })
}

export function useCreateEventBudgetItem() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({
      event_budget_id,
      ...input
    }: CreateEventBudgetItemInput): Promise<EventBudgetItem> => {
      const res = await fetch(`/api/event-budgets/${event_budget_id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được hạng mục")
      return json.data
    },
    onSuccess: (data) => {
      if (householdId) {
        void qc.invalidateQueries({
          queryKey: keys.eventBudget(householdId, data.event_budget_id),
        })
        void qc.invalidateQueries({ queryKey: keys.eventBudgets(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })
}

export function useUpdateEventBudgetItem() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({
      eventBudgetId,
      itemId,
      ...input
    }: { eventBudgetId: string; itemId: string } & UpdateEventBudgetItemInput): Promise<EventBudgetItem> => {
      const res = await fetch(`/api/event-budgets/${eventBudgetId}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được hạng mục")
      return json.data
    },
    onSuccess: (data) => {
      if (householdId) {
        void qc.invalidateQueries({
          queryKey: keys.eventBudget(householdId, data.event_budget_id),
        })
        void qc.invalidateQueries({ queryKey: keys.eventBudgets(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })
}

export function useDeleteEventBudgetItem() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({
      eventBudgetId,
      itemId,
    }: {
      eventBudgetId: string
      itemId: string
    }) => {
      const res = await fetch(`/api/event-budgets/${eventBudgetId}/items/${itemId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được hạng mục")
      return { eventBudgetId }
    },
    onSuccess: ({ eventBudgetId }) => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.eventBudget(householdId, eventBudgetId) })
        void qc.invalidateQueries({ queryKey: keys.eventBudgets(householdId) })
      }
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })
}
