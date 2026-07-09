import type { Fund } from "@/types/app"

export function resolveActiveGoalFund(funds: Fund[]): Pick<Fund, "name" | "monthly_contribution"> | null {
  return funds.find((f) => f.fund_type === "goal") ?? funds.find((f) => f.fund_type === "emergency") ?? null
}
