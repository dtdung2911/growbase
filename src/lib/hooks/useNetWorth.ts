"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { SystemBalance } from "@/types/app"
import type { NetWorthSnapshotInput } from "@/lib/validations/net-worth"

type NetWorthPageData = {
  snapshot: Record<string, unknown> | null
  systemBalances: SystemBalance[]
  funds: { id: string; name: string; current_balance: number; fund_type: string; icon: string | null }[]
}

export function useNetWorthSnapshot() {
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useQuery({
    queryKey: keys.netWorth(householdId ?? "", month),
    queryFn: async (): Promise<NetWorthPageData> => {
      const res = await fetch(`/api/net-worth?month=${month}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được tài sản ròng")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

type NetWorthHistoryItem = {
  snapshot_month: string
  total_recorded: number
  total_system: number
  discrepancy: number
}

export function useNetWorthHistory() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.netWorthHistory(householdId ?? ""),
    queryFn: async (): Promise<NetWorthHistoryItem[]> => {
      const res = await fetch("/api/net-worth/history")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được lịch sử")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useUpsertNetWorth() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: NetWorthSnapshotInput) => {
      const res = await fetch("/api/net-worth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không lưu được")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.netWorth(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.netWorthHistory(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useSystemBalances() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.systemBalances(householdId ?? ""),
    queryFn: async (): Promise<SystemBalance[]> => {
      const res = await fetch(`/api/net-worth?month=${new Date().toISOString().slice(0, 7)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được số dư")
      return json.data?.systemBalances ?? []
    },
    enabled: Boolean(householdId),
  })
}
