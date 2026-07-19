"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Fund, FundTransaction } from "@growbase/shared/types/app"
import type {
  FundContributeInput,
  FundWithdrawInput,
  FundExpenseInput,
  CreateFundInput,
  UpdateFundInput,
} from "@growbase/shared/schemas/fund"

// Nạp/rút quỹ tạo transaction theo transaction_date — invalidate cả tháng của
// giao dịch lẫn tháng đang xem, kèm budget/dashboard/reports bị ảnh hưởng.
function invalidateFundOpCaches(
  qc: ReturnType<typeof useQueryClient>,
  householdId: string,
  fundId: string,
  storeMonth: string,
  txDate: string
) {
  const txMonth = txDate.slice(0, 7)
  const months = txMonth === storeMonth ? [storeMonth] : [txMonth, storeMonth]
  for (const m of months) {
    void qc.invalidateQueries({ queryKey: keys.transactions(householdId, m) })
    void qc.invalidateQueries({ queryKey: keys.budget(householdId, m) })
    void qc.invalidateQueries({ queryKey: keys.budgetActuals(householdId, m) })
    void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, m) })
  }
  // màn Reports thực tế cache dưới key monthlySummary (useMonthlyReport), không phải "reports"
  void qc.invalidateQueries({ queryKey: keys.monthlySummaryByHousehold(householdId) })
  void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
  void qc.invalidateQueries({ queryKey: keys.fundTransactions(householdId, fundId) })
  void qc.invalidateQueries({ queryKey: keys.fundDetail(householdId, fundId) })
  void qc.invalidateQueries({ queryKey: keys.livingPlan(householdId) })
}

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
    queryKey: keys.fundDetail(householdId ?? "", fundId),
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
        void qc.invalidateQueries({ queryKey: keys.livingPlan(householdId) })
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
  const { t } = useTranslation()
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
      if (!res.ok) throw new Error(json.error ?? t("funds.updateFailed"))
      return json.data as Fund
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
        void qc.invalidateQueries({ queryKey: keys.fundDetail(householdId, fundId) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.livingPlan(householdId) })
      }
      toast.success(t("funds.updateSuccess"), { duration: 2000 })
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
        void qc.invalidateQueries({ queryKey: keys.livingPlan(householdId) })
        void qc.removeQueries({ queryKey: keys.fundDetail(householdId, fundId) })
        void qc.removeQueries({ queryKey: keys.fundTransactions(householdId, fundId) })
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
    onSuccess: (_data, variables) => {
      if (householdId) {
        invalidateFundOpCaches(qc, householdId, fundId, month, variables.transaction_date)
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
    onSuccess: (_data, variables) => {
      if (householdId) {
        invalidateFundOpCaches(qc, householdId, fundId, month, variables.transaction_date)
      }
      toast.success("Đã rút quỹ", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

// Chi từ quỹ (19-7): fund_id trong input để dùng được từ cả form giao dịch
// (quỹ chọn động) lẫn modal trang quỹ.
export function useFundExpense() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async ({ fund_id, ...input }: FundExpenseInput & { fund_id: string }) => {
      const res = await fetch(`/api/funds/${fund_id}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? t("funds.expenseFailed"))
      return json.data as { tx_id: string }
    },
    onSuccess: (_data, variables) => {
      if (householdId) {
        invalidateFundOpCaches(qc, householdId, variables.fund_id, month, variables.transaction_date)
      }
      toast.success(t("funds.expenseSuccess"), { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

// Đổi nguồn tiền hậu kiểm (19-7): gắn/bỏ fund_id trên expense hiện hữu.
export function useChangeFundSource() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: {
      transaction_id: string
      fund_id: string | null
      previous_fund_id: string | null
      transaction_date: string
    }) => {
      const res = await fetch(`/api/transactions/${input.transaction_id}/change-source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fund_id: input.fund_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? t("funds.changeSourceFailed"))
      return json.data as { changed: boolean }
    },
    onSuccess: (_data, v) => {
      if (householdId) {
        // Invalidate cache của cả quỹ mới lẫn quỹ cũ
        const fundIds = [v.fund_id, v.previous_fund_id].filter(Boolean) as string[]
        for (const id of fundIds.length ? fundIds : [""]) {
          invalidateFundOpCaches(qc, householdId, id, month, v.transaction_date)
        }
      }
      toast.success(t("funds.changeSourceSuccess"), { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useFundContributionRevert(fundId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: { fund_tx_id: string; transaction_date: string }) => {
      const res = await fetch(`/api/funds/${fundId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fund_tx_id: input.fund_tx_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? t("funds.revertFailed"))
      return json.data as { reverted: boolean }
    },
    onSuccess: (_data, variables) => {
      if (householdId) {
        invalidateFundOpCaches(qc, householdId, fundId, month, variables.transaction_date)
      }
      toast.success(t("funds.revertSuccess"), { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

// Đổi hạng goal funds: PATCH tuần tự priority_rank = index+1 cho MỌI quỹ theo thứ tự mới —
// dedup + đóng gaps tự nhiên (trả deferred ghost ranks 12-1). Lỗi giữa chừng → refetch để hoà lại.
export function useReorderGoalFunds() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  const invalidate = () => {
    if (!householdId) return
    void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
    void qc.invalidateQueries({ queryKey: keys.livingPlan(householdId) })
    void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
  }

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const res = await fetch(`/api/funds/${orderedIds[i]}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority_rank: i + 1 }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? t("funds.plan.rankFailed"))
      }
    },
    onSuccess: () => {
      invalidate()
      toast.success(t("funds.plan.rankSaved"), { duration: 2000 })
    },
    onError: (err: Error) => {
      invalidate()
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useFundRelease(fundId: string) {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

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
        void qc.invalidateQueries({ queryKey: keys.fundDetail(householdId, fundId) })
        void qc.invalidateQueries({ queryKey: keys.livingPlan(householdId) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
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
