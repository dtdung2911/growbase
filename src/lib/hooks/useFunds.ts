"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { Fund, FundTransaction } from "@/types/app"
import type {
  FundContributeInput,
  FundWithdrawInput,
  CreateFundInput,
  UpdateFundInput,
} from "@/lib/validations/fund"

export function useFunds() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.funds(householdId ?? ""),
    queryFn: async (): Promise<Fund[]> => {
      const res = await fetch("/api/funds")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được quỹ")
      return json.data
    },
    staleTime: 30_000,
    enabled: Boolean(householdId),
  })
}

export function useFundDetail(fundId: string) {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: ["fund-detail", householdId ?? "", fundId],
    queryFn: async (): Promise<{ fund: Fund; history: FundTransaction[] }> => {
      const res = await fetch(`/api/funds/${fundId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được quỹ")
      return json.data
    },
    staleTime: 30_000,
    enabled: Boolean(householdId) && Boolean(fundId),
  })
}

export function useCreateFund() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: CreateFundInput) => {
      const res = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được quỹ")
      return json.data as Fund
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
      }
      toast.success("Đã tạo quỹ", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useUpdateFund(fundId: string) {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: UpdateFundInput) => {
      const res = await fetch(`/api/funds/${fundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được quỹ")
      return json.data as Fund
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
        void qc.invalidateQueries({ queryKey: ["fund-detail", householdId, fundId] })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
      }
      toast.success("Đã cập nhật", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useDeleteFund(fundId: string) {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/funds/${fundId}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được quỹ")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
      }
      toast.success("Đã xóa quỹ", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useFundContribute(fundId: string) {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: FundContributeInput) => {
      const res = await fetch(`/api/funds/${fundId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không nạp quỹ được")
      return json.data as { tx_id: string }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
        void qc.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.fundTransactions(householdId, fundId) })
      }
      toast.success("Đã nạp quỹ", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useFundWithdraw(fundId: string) {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: FundWithdrawInput) => {
      const res = await fetch(`/api/funds/${fundId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không rút quỹ được")
      return json.data as { tx_id: string }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
        void qc.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.fundTransactions(householdId, fundId) })
      }
      toast.success("Đã rút quỹ", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useFundRelease(fundId: string) {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/funds/${fundId}/release`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không giải phóng được quỹ đệm")
      return json.data as { released_at: string }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
      }
      toast.success("Đã giải phóng quỹ đệm", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useFundTransactions(fundId: string) {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.fundTransactions(householdId ?? "", fundId),
    queryFn: async (): Promise<FundTransaction[]> => {
      const res = await fetch(`/api/funds/${fundId}/transactions`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được lịch sử quỹ")
      return json.data
    },
    staleTime: 30_000,
    enabled: Boolean(householdId) && Boolean(fundId),
  })
}
