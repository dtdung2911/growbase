"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import { useWizardStore } from "@/lib/stores/wizardStore"
import type { CompleteOnboardingInput } from "@/lib/validations/onboarding"

export function useCompleteOnboarding() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const reset = useWizardStore((s) => s.reset)
  const currentMonth = useAppStore((s) => s.currentMonth)

  return useMutation({
    mutationFn: async (
      input: CompleteOnboardingInput
    ): Promise<{ householdId: string }> => {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không hoàn thành được thiết lập")
      return json.data
    },
    onSuccess: ({ householdId }) => {
      reset()
      queryClient.invalidateQueries({ queryKey: keys.household(householdId) })
      queryClient.invalidateQueries({
        queryKey: keys.budget(householdId, currentMonth),
      })
      queryClient.invalidateQueries({ queryKey: keys.debts(householdId) })
      toast.success("Đã lưu", { duration: 2000 })
      router.push("/dashboard")
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
