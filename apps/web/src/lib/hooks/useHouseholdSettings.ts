"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { Household } from "@growbase/shared/types/app"
import type { UpdateHouseholdInput } from "@growbase/shared/schemas/household-settings"

export function useUpdateHousehold() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (input: UpdateHouseholdInput): Promise<Household> => {
      const res = await fetch("/api/household", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không cập nhật được hộ gia đình")
      return json.data
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.household(householdId) })
      }
      toast.success("Đã lưu", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
