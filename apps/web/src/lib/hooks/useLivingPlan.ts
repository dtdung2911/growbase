"use client"

import { useQuery } from "@tanstack/react-query"
import { keys } from "@growbase/shared/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import {
  calculateAllocationPlan,
  sumBudgetPct,
  type AllocationPlan,
} from "@growbase/shared/constants/budgetTemplate"

type LivingPlanGoal = {
  id: string
  name: string
  targetAmount: number
  currentBalance: number
  priorityRank: number | null
}

type LivingPlanResponse = {
  trailingIncome: number
  currentMonthIncome: number
  emergencyBalance: number
  emergencyTargetAmount: number | null
  emergencyTargetMonths: number | null
  goals: LivingPlanGoal[]
  contributedLastMonth: boolean
}

// Hook DUY NHẤT tính kế hoạch sống từ state thật (BR-OB-014): rank DB + income thực + balance thật.
// 12.2/12.3/12.4/13.x đều đọc hook này để mọi màn hình vận hành cùng một kế hoạch luôn tươi.
export function useLivingPlan() {
  const householdId = useAppStore((s) => s.householdId)

  const query = useQuery({
    queryKey: keys.livingPlan(householdId ?? ""),
    queryFn: async (): Promise<LivingPlanResponse> => {
      const res = await fetch("/api/living-plan")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được kế hoạch")
      return json.data
    },
    enabled: Boolean(householdId),
  })

  const data = query.data

  const plan: AllocationPlan | null = data
    ? calculateAllocationPlan({
        monthlyIncome: data.trailingIncome,
        emergencyBalance: data.emergencyBalance,
        // Target DB (user-editable) drive ngưỡng GĐ + timeline; null → engine estimate theo income.
        ...(data.emergencyTargetAmount != null ? { emergencyTarget: data.emergencyTargetAmount } : {}),
        ...(data.emergencyTargetMonths != null ? { emergencyTargetMonths: data.emergencyTargetMonths } : {}),
        // goals đã sort theo priority_rank ở route (index 0 = hạng cao nhất);
        // initialBalance = số dư thật từng quỹ (lần đầu dùng balance thật, không phải snapshot).
        goals: data.goals.map((g) => ({
          id: g.id,
          targetAmount: g.targetAmount,
          initialBalance: g.currentBalance,
        })),
      })
    : null

  // capacity THÁNG hiện tại = 15% × thu nhập thực tháng này (BR-OB-015). Derive % từ engine, không hardcode.
  const capacityThisMonth = data
    ? Math.round(data.currentMonthIncome * (sumBudgetPct(["savings_investment"]) / 100))
    : 0

  return {
    plan,
    capacityThisMonth,
    emergencyBalance: data?.emergencyBalance ?? 0,
    trailingIncome: data?.trailingIncome ?? 0,
    contributedLastMonth: data?.contributedLastMonth ?? true,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
