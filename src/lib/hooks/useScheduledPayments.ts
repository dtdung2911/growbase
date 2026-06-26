"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { ScheduledPayment, UrgencyLevel } from "@/types/app"
import type { ScheduledPaymentCreateInput, MarkPaidFormInput } from "@/lib/validations/scheduled-payment"
import { differenceInDays } from "date-fns"

function computeUrgency(nextDueDate: string): { daysUntilDue: number; urgencyLevel: UrgencyLevel } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate)
  due.setHours(0, 0, 0, 0)
  const daysUntilDue = differenceInDays(due, today)

  let urgencyLevel: UrgencyLevel = "normal"
  if (daysUntilDue < 0) urgencyLevel = "overdue"
  else if (daysUntilDue <= 7) urgencyLevel = "due-soon"
  else if (daysUntilDue <= 30) urgencyLevel = "upcoming"

  return { daysUntilDue, urgencyLevel }
}

function enrichPayment(row: Record<string, unknown>): ScheduledPayment {
  const { daysUntilDue, urgencyLevel } = computeUrgency(row.next_due_date as string)
  return {
    ...(row as Omit<ScheduledPayment, "days_until_due" | "urgency_level">),
    days_until_due: daysUntilDue,
    urgency_level: urgencyLevel,
  }
}

export function useScheduledPayments() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.scheduledPayments(householdId ?? ""),
    queryFn: async (): Promise<ScheduledPayment[]> => {
      const res = await fetch("/api/scheduled-payments")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được khoản định kỳ")
      return (json.data as Record<string, unknown>[]).map(enrichPayment)
    },
    enabled: Boolean(householdId),
  })
}

export function useCreateScheduledPayment() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (input: ScheduledPaymentCreateInput) => {
      const res = await fetch("/api/scheduled-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được khoản định kỳ")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.scheduledPayments(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useUpdateScheduledPayment() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (input: { id: string } & Partial<ScheduledPaymentCreateInput> & { status?: string }) => {
      const { id, ...body } = input
      const res = await fetch(`/api/scheduled-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.scheduledPayments(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useMarkPaymentPaid() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const month = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (input: { paymentId: string } & MarkPaidFormInput) => {
      const { paymentId, ...body } = input
      const res = await fetch(`/api/scheduled-payments/${paymentId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không thanh toán được")
      return json.data as { payment_id: string; tx_id: string | null }
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.scheduledPayments(householdId) })
        void qc.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
        void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
      }
      toast.success("Đã thanh toán", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
