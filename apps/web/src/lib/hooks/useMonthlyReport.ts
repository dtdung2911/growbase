"use client"

import { useQuery } from "@tanstack/react-query"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { MonthlySummaryRow } from "@/app/api/reports/monthly-summary/route"

export type { MonthlySummaryRow }

export function useMonthlyReport(months = 6) {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.monthlySummary(householdId ?? "", months),
    queryFn: async (): Promise<MonthlySummaryRow[]> => {
      const res = await fetch(`/api/reports/monthly-summary?months=${months}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được báo cáo")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}
