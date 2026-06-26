"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import { useWizardStore } from "@/lib/stores/wizardStore"
import type { Household } from "@/types/app"
import type { HouseholdInput } from "@/lib/validations/household"

export function useHousehold(householdId: string) {
  return useQuery({
    queryKey: keys.household(householdId),
    queryFn: async (): Promise<Household | null> => {
      const res = await fetch("/api/household")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được hộ gia đình")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useUpsertHousehold() {
  const setHouseholdId = useAppStore((s) => s.setHouseholdId)
  const setHousehold = useWizardStore((s) => s.setHousehold)

  return useMutation({
    mutationFn: async (input: HouseholdInput): Promise<Household> => {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không lưu được hộ gia đình")
      return json.data
    },
    onSuccess: (data) => {
      setHouseholdId(data.id)
      setHousehold(data.id, data.household_type, data.currency)
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
