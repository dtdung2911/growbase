import { GOAL_MILESTONES } from "./goalProgress"
import type { Fund } from "@/types/app"

// fundId → mốc cao nhất đã thấy (persist ở caller, key theo householdId — AD-3)
export type SeenMilestones = Record<string, number>

export type MilestoneCelebration = {
  fundId: string
  fundName: string
  milestone: number
}

export function currentMilestoneTier(fund: Fund): number {
  if (!fund.target_amount || fund.target_amount <= 0) return 0
  const pct = (fund.current_balance / fund.target_amount) * 100
  let tier = 0
  for (const milestone of GOAL_MILESTONES) {
    if (pct >= milestone) tier = milestone
  }
  return tier
}

export function resolveMilestoneCelebration(
  funds: Fund[],
  seen: SeenMilestones
): { celebration: MilestoneCelebration | null; nextSeen: SeenMilestones } {
  const nextSeen: SeenMilestones = { ...seen }
  let celebration: MilestoneCelebration | null = null

  for (const fund of funds) {
    if (fund.fund_type !== "goal" || !fund.target_amount || fund.target_amount <= 0) continue

    const tier = currentMilestoneTier(fund)
    const seenTier = seen[fund.id]

    // Chưa từng thấy fund này → baseline init im lặng (không chúc mừng mốc cũ)
    if (seenTier === undefined) {
      nextSeen[fund.id] = tier
      continue
    }

    // Giữ max — balance tụt rồi góp lại không chúc lần 2
    nextSeen[fund.id] = Math.max(seenTier, tier)

    if (tier > seenTier && (!celebration || tier > celebration.milestone)) {
      celebration = { fundId: fund.id, fundName: fund.name, milestone: tier }
    }
  }

  return { celebration, nextSeen }
}
