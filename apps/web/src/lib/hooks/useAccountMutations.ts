"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { Account } from "@growbase/shared/types/app"
import type { UpdateAccountInput } from "@growbase/shared/schemas/account-settings"

export function useUpdateAccount() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & UpdateAccountInput): Promise<Account> => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được tài khoản")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.accounts(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useSoftDeleteAccount() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được tài khoản")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.accounts(householdId) })
      }
      toast.success("Đã ẩn tài khoản", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
