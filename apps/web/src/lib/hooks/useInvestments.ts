"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type {
  InvestmentHolding,
  InvestmentDcaPlan,
  InvestmentPurchase,
} from "@growbase/shared/types/app"
import type {
  CreateHoldingInput,
  UpdateHoldingInput,
  CreateDcaPlanInput,
  CreatePurchaseInput,
  UpdatePurchaseInput,
} from "@growbase/shared/schemas/investment"

export function useInvestmentHoldings() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  const query = useQuery({
    queryKey: keys.investmentHoldings(householdId ?? ""),
    queryFn: async (): Promise<InvestmentHolding[]> => {
      const res = await fetch("/api/investments")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được danh mục đầu tư")
      return json.data
    },
    enabled: Boolean(householdId),
  })

  const invalidate = () => {
    if (householdId) {
      void qc.invalidateQueries({ queryKey: keys.investmentHoldings(householdId) })
    }
  }

  const create = useMutation({
    mutationFn: async (input: CreateHoldingInput): Promise<InvestmentHolding> => {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được khoản đầu tư")
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & UpdateHoldingInput): Promise<InvestmentHolding> => {
      const res = await fetch(`/api/investments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được khoản đầu tư")
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được khoản đầu tư")
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })

  return { ...query, create, update, remove }
}

export function useInvestmentDcaPlans() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  const query = useQuery({
    queryKey: keys.investmentDcaPlans(householdId ?? ""),
    queryFn: async (): Promise<InvestmentDcaPlan[]> => {
      const res = await fetch("/api/investments/dca")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được kế hoạch DCA")
      return json.data
    },
    enabled: Boolean(householdId),
  })

  const upsert = useMutation({
    mutationFn: async (input: CreateDcaPlanInput): Promise<InvestmentDcaPlan> => {
      const res = await fetch("/api/investments/dca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không lưu được kế hoạch DCA")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.investmentDcaPlans(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })

  return { ...query, upsert }
}

export function useInvestmentPurchases(holdingId?: string) {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  const query = useQuery({
    queryKey: keys.investmentPurchases(householdId ?? "", holdingId),
    queryFn: async (): Promise<InvestmentPurchase[]> => {
      const url = holdingId
        ? `/api/investments/purchases?holding_id=${holdingId}`
        : "/api/investments/purchases"
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được lịch sử mua")
      return json.data
    },
    enabled: Boolean(householdId),
  })

  const invalidate = () => {
    if (householdId) {
      void qc.invalidateQueries({ queryKey: keys.investmentPurchases(householdId, holdingId) })
      void qc.invalidateQueries({ queryKey: keys.investmentHoldings(householdId) })
    }
  }

  const create = useMutation({
    mutationFn: async (input: CreatePurchaseInput): Promise<InvestmentPurchase> => {
      const res = await fetch("/api/investments/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được giao dịch mua")
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & UpdatePurchaseInput): Promise<InvestmentPurchase> => {
      const res = await fetch(`/api/investments/purchases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được giao dịch mua")
      return json.data
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/purchases/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được giao dịch mua")
    },
    onSuccess: () => {
      invalidate()
      toast.success("Đã xóa", { duration: 2000 })
    },
    onError: (err: Error) => toast.error(err.message, { duration: 5000 }),
  })

  return { ...query, create, update, remove }
}
