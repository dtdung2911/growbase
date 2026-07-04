import { describe, expect, it } from "vitest"
import type { BudgetActualLine } from "@/types/app"
import { formatVND } from "@/lib/utils/currency"
import { calculateDailyRemaining } from "../dailyRemaining"
import { buildInsightDescriptor, selectState } from "../selectState"

function line(overrides: Partial<BudgetActualLine>): BudgetActualLine {
  return {
    cost_type_id: "id",
    cost_type_code: "",
    cost_type_name: "Ăn uống ngoài",
    budget_pct: 0,
    override_pct: null,
    effective_pct: 0,
    budget_amount: 0,
    actual_amount: 0,
    remaining: 0,
    usage_pct: 0,
    ...overrides,
  }
}

const today = new Date(2026, 6, 15) // July 2026, 31 days
const budgetLines = [line({ cost_type_name: "Ăn uống ngoài", budget_amount: 3_100_000, actual_amount: 0 })] // 100k/day avg
const goalFund = { name: "Quỹ học", monthly_contribution: 3_300_000 }

describe("selectState", () => {
  it("returns first-day when household has never recorded any transaction", () => {
    const state = selectState({
      budgetLines,
      yesterdayTransactions: [],
      hasAnyTransactionEver: false,
      activeGoalFund: goalFund,
      today,
    })
    expect(state).toBe("first-day")
  })

  it("returns first-day even when budgetLines is empty (day-0 always wins)", () => {
    const state = selectState({
      budgetLines: [],
      yesterdayTransactions: [],
      hasAnyTransactionEver: false,
      activeGoalFund: null,
      today,
    })
    expect(state).toBe("first-day")
  })

  it("returns no-transactions-yesterday when household has history but logged nothing yesterday", () => {
    const state = selectState({
      budgetLines,
      yesterdayTransactions: [],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(state).toBe("no-transactions-yesterday")
  })

  it("returns under-plan-yesterday when yesterday's flexible spend is below the daily average", () => {
    const state = selectState({
      budgetLines,
      yesterdayTransactions: [{ amount: 35_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(state).toBe("under-plan-yesterday")
  })

  it("treats spent === plan as under-plan-yesterday (boundary uses <=)", () => {
    const state = selectState({
      budgetLines,
      yesterdayTransactions: [{ amount: 100_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(state).toBe("under-plan-yesterday")
  })

  it("returns over-plan-yesterday when yesterday's flexible spend exceeds the daily average", () => {
    const state = selectState({
      budgetLines,
      yesterdayTransactions: [{ amount: 185_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(state).toBe("over-plan-yesterday")
  })

  it("ignores non-flexible/incoming transactions when computing yesterday's flexible spend", () => {
    const state = selectState({
      budgetLines,
      yesterdayTransactions: [
        { amount: 5_000_000, direction: "in", behavior_type: null },
        { amount: 2_000_000, direction: "out", behavior_type: "fixed" },
      ],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(state).toBe("under-plan-yesterday")
  })
})

describe("buildInsightDescriptor", () => {
  it("maps first-day to insight.firstDay with remainingToday param", () => {
    const descriptor = buildInsightDescriptor({
      budgetLines,
      yesterdayTransactions: [],
      hasAnyTransactionEver: false,
      activeGoalFund: null,
      today,
    })
    expect(descriptor.state).toBe("first-day")
    expect(descriptor.i18nKey).toBe("insight.firstDay")
    expect(descriptor.params.remainingToday).toBeTruthy()
  })

  it("maps under-plan-yesterday to insight.underPlanYesterday with goal + diff params", () => {
    const descriptor = buildInsightDescriptor({
      budgetLines,
      yesterdayTransactions: [{ amount: 35_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(descriptor.i18nKey).toBe("insight.underPlanYesterday")
    expect(descriptor.params.goalName).toBe("Quỹ học")
    expect(descriptor.params.yesterdaySpent).toBeTruthy()
    expect(descriptor.params.yesterdayDiff).toBeTruthy()
    expect(descriptor.params.monthlyContribution).toBeTruthy()
  })

  it("maps over-plan-yesterday to insight.overPlanYesterday", () => {
    const descriptor = buildInsightDescriptor({
      budgetLines,
      yesterdayTransactions: [{ amount: 185_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(descriptor.i18nKey).toBe("insight.overPlanYesterday")
  })

  it("computes exact yesterdayPlan/yesterdayDiff from the same daily-average formula (under plan)", () => {
    const descriptor = buildInsightDescriptor({
      budgetLines,
      yesterdayTransactions: [{ amount: 35_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(descriptor.params.yesterdaySpent).toBe(formatVND(35_000))
    expect(descriptor.params.yesterdayPlan).toBe(formatVND(100_000))
    expect(descriptor.params.yesterdayDiff).toBe(formatVND(65_000))
    expect(descriptor.params.goalName).toBe("Quỹ học")
    expect(descriptor.params.monthlyContribution).toBe(formatVND(3_300_000))
    expect(descriptor.params.remainingToday).toBe(formatVND(calculateDailyRemaining(budgetLines, today)))
  })

  it("computes exact yesterdayDiff as absolute overshoot when over plan", () => {
    const descriptor = buildInsightDescriptor({
      budgetLines,
      yesterdayTransactions: [{ amount: 185_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(descriptor.params.yesterdayDiff).toBe(formatVND(85_000))
    expect(descriptor.params.remainingToday).toBe(formatVND(calculateDailyRemaining(budgetLines, today)))
    expect(descriptor.params.goalName).toBe("Quỹ học")
    expect(descriptor.params.monthlyContribution).toBe(formatVND(3_300_000))
  })

  it("returns empty goalName/monthlyContribution when household has no active goal fund", () => {
    const descriptor = buildInsightDescriptor({
      budgetLines,
      yesterdayTransactions: [{ amount: 35_000, direction: "out", behavior_type: "wasteful" }],
      hasAnyTransactionEver: true,
      activeGoalFund: null,
      today,
    })
    expect(descriptor.params.goalName).toBe("")
    expect(descriptor.params.monthlyContribution).toBe("")
  })

  it("maps no-transactions-yesterday to insight.noTransactionsYesterday", () => {
    const descriptor = buildInsightDescriptor({
      budgetLines,
      yesterdayTransactions: [],
      hasAnyTransactionEver: true,
      activeGoalFund: goalFund,
      today,
    })
    expect(descriptor.i18nKey).toBe("insight.noTransactionsYesterday")
  })
})
