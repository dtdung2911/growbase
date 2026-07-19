import { formatVND } from "./currency"
import type { Fund } from "../types/app"

// Ngưỡng duy nhất: quyết định cả state (ahead/behind vs on-track) lẫn rule "đáng nói" (AC3)
export const GOAL_NOTEWORTHY_MONTHS = 1
export const GOAL_MILESTONES = [10, 25, 50, 75, 100] as const

const DAY_MS = 86_400_000

export type GoalProgressState = "ahead" | "behind" | "on-track"

export type GoalProgressInput = {
  targetAmount: number | null
  currentBalance: number
  createdAt: string
  targetDate: string | null
  today?: Date
}

export type GoalProgress = {
  actualRatio: number
  expectedRatio: number
  expectedAmount: number
  deviationAmount: number
  deviationMonths: number
  state: GoalProgressState
  monthsEarly: number | null
  catchUpAmount: number | null
}

export type GoalNarrativeDescriptor = {
  state: GoalProgressState
  i18nKey: string
  params: Record<string, string | number>
}

export type LastShownNarrative = { i18nKey: string; dateISO: string }

// Date-only string ("2026-10-28") phải parse theo local, không qua Date.parse (UTC midnight)
function localDayStart(value: string | Date): number {
  if (typeof value === "string" && !value.includes("T")) {
    const [y, m, d] = value.split("-").map(Number)
    return new Date(y, m - 1, d).getTime()
  }
  const date = typeof value === "string" ? new Date(value) : value
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function daysBetween(fromDayStart: number, toDayStart: number): number {
  return Math.round((toDayStart - fromDayStart) / DAY_MS)
}

export function computeGoalProgress(input: GoalProgressInput): GoalProgress | null {
  const { targetAmount, currentBalance, createdAt, targetDate } = input
  // Không đủ dữ liệu dựng expected line (vd Quỹ khẩn cấp onboarding: target_date null) → null, không throw
  if (!targetAmount || targetAmount <= 0 || !targetDate) return null

  const created = localDayStart(createdAt)
  const totalDays = daysBetween(created, localDayStart(targetDate))
  if (totalDays <= 0) return null

  const daysElapsed = Math.max(daysBetween(created, localDayStart(input.today ?? new Date())), 0)
  const expectedRatio = Math.min(daysElapsed / totalDays, 1)
  const expectedAmount = targetAmount * expectedRatio
  const actualRatio = currentBalance / targetAmount
  const deviationAmount = currentBalance - expectedAmount
  const monthlyExpectedPace = (targetAmount * 30) / totalDays
  const deviationMonths = deviationAmount / monthlyExpectedPace

  let state: GoalProgressState = "on-track"
  if (actualRatio >= 1 || deviationMonths >= GOAL_NOTEWORTHY_MONTHS) state = "ahead"
  else if (deviationMonths <= -GOAL_NOTEWORTHY_MONTHS) state = "behind"

  return {
    actualRatio,
    expectedRatio,
    expectedAmount,
    deviationAmount,
    deviationMonths,
    state,
    monthsEarly: state === "ahead" ? computeMonthsEarly(targetAmount, currentBalance, daysElapsed, totalDays) : null,
    catchUpAmount: state === "behind" ? expectedAmount - currentBalance : null,
  }
}

// "N từ tốc độ góp thực tế" (AC2): pace = balance/ngày đã qua → chiếu ngày về đích, so với deadline
function computeMonthsEarly(target: number, balance: number, daysElapsed: number, totalDays: number): number {
  const pace = balance / Math.max(daysElapsed, 1)
  if (pace <= 0) return 1
  const projectedDays = target / pace
  return Math.max(Math.round((totalDays - projectedDays) / 30), 1)
}

export function buildGoalNarrative(progress: GoalProgress, goalName: string): GoalNarrativeDescriptor {
  if (progress.state === "ahead") {
    return { state: "ahead", i18nKey: "insight.goalAhead", params: { goalName, monthsEarly: progress.monthsEarly ?? 1 } }
  }
  if (progress.state === "behind") {
    return {
      state: "behind",
      i18nKey: "insight.goalBehind",
      params: { goalName, catchUpAmount: formatVND(progress.catchUpAmount ?? 0) },
    }
  }
  return { state: "on-track", i18nKey: "insight.goalOnTrack", params: { goalName } }
}

// Mốc CAO NHẤT vừa vượt giữa 2 lần đo (5% → 60% trả 50). Story 6.3 dùng cho celebration.
export function crossedMilestone(prevRatio: number, currentRatio: number): number | null {
  for (let i = GOAL_MILESTONES.length - 1; i >= 0; i--) {
    const milestone = GOAL_MILESTONES[i]
    if (prevRatio * 100 < milestone && currentRatio * 100 >= milestone) return milestone
  }
  return null
}

// Persistence của lastShown là việc của caller (story 6.2 — localStorage key chứa householdId, AD-3)
export function isGoalNoteworthy(
  progress: GoalProgress,
  opts: { justCrossedMilestone?: boolean; lastShown?: LastShownNarrative | null; today?: Date } = {}
): boolean {
  if (opts.justCrossedMilestone) return true
  if (progress.state === "on-track") return false

  const { lastShown } = opts
  if (!lastShown) return true
  if (lastShown.i18nKey !== buildGoalNarrative(progress, "").i18nKey) return true

  // Đã show cùng câu hôm nay hoặc hôm qua → im lặng (không lặp liên tiếp nhiều ngày)
  return daysBetween(localDayStart(lastShown.dateISO), localDayStart(opts.today ?? new Date())) > 1
}

export function goalProgressInputFromFund(fund: Fund, today?: Date): GoalProgressInput {
  return {
    targetAmount: fund.target_amount,
    currentBalance: fund.current_balance,
    createdAt: fund.created_at,
    targetDate: fund.target_date,
    today,
  }
}
