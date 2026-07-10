import { describe, expect, it } from "vitest"
import type { AllocationPlan } from "@/lib/constants/budgetTemplate"
import type { Fund, FundTransaction } from "@/types/app"
import {
  findFundAllocation,
  fundGoalChannel,
  hasContributedInMonth,
  suggestedContribution,
  sumContributedInMonth,
} from "../fundPlan"

function makeFund(over: Partial<Fund>): Fund {
  return {
    id: "goal-long",
    household_id: "h1",
    name: "Nhà",
    description: null,
    fund_type: "goal",
    current_balance: 0,
    target_amount: null,
    monthly_contribution: null,
    contribution_day: 1,
    expected_return_rate: null,
    target_date: null,
    target_months_expense: null,
    reset_monthly: false,
    release_trigger: null,
    released_at: null,
    color: null,
    icon: null,
    is_active: true,
    priority: 0,
    priority_rank: null,
    per_member: false,
    amount_per_member: null,
    sort_order: 0,
    created_at: "2026-01-01",
    ...over,
  }
}

const plan: AllocationPlan = {
  capacityMonthly: 3_000_000,
  emergencyTarget: 30_000_000,
  stage1EndMonth: 3,
  stage2EndMonth: 10,
  allocations: [
    { id: "emergency", monthlyAmount: 1_000_000, timelineMonths: 10 },
    { id: "goal-long", monthlyAmount: 2_000_000, timelineMonths: 150 },
    { id: "goal-short", monthlyAmount: 500_000, timelineMonths: 12 },
    { id: "goal-nulltl", monthlyAmount: null, timelineMonths: null },
  ],
}

function makeTx(over: Partial<FundTransaction>): FundTransaction {
  return {
    id: "t1",
    fund_id: "goal-long",
    transaction_type: "contribution",
    amount: 100_000,
    direction: "in",
    balance_after: 100_000,
    description: null,
    transaction_date: "2026-07-05",
    is_automatic: false,
    created_at: "2026-07-05",
    ...over,
  }
}

describe("findFundAllocation", () => {
  it("matches emergency by fund_type → id 'emergency'", () => {
    const fund = makeFund({ id: "some-uuid", fund_type: "emergency" })
    expect(findFundAllocation(plan, fund)?.id).toBe("emergency")
  })

  it("matches goal by fund.id", () => {
    expect(findFundAllocation(plan, makeFund({ id: "goal-short" }))?.id).toBe("goal-short")
  })

  it("returns null when goal not in plan", () => {
    expect(findFundAllocation(plan, makeFund({ id: "missing" }))).toBeNull()
  })
})

describe("fundGoalChannel", () => {
  it("returns null for emergency (safety ≠ investment)", () => {
    expect(fundGoalChannel(makeFund({ id: "emergency", fund_type: "emergency" }), plan)).toBeNull()
  })

  it("returns null for short goal (baseline ≤ 24)", () => {
    expect(fundGoalChannel(makeFund({ id: "goal-short", target_amount: 10_000_000 }), plan)).toBeNull()
  })

  it("returns null when no target", () => {
    expect(fundGoalChannel(makeFund({ id: "goal-long", target_amount: null }), plan)).toBeNull()
  })

  it("returns null when already fully funded (remaining ≤ 0)", () => {
    const fund = makeFund({ id: "goal-long", target_amount: 100_000_000, current_balance: 100_000_000 })
    expect(fundGoalChannel(fund, plan)).toBeNull()
  })

  it("long goal → index tier 8% with shortened compound months", () => {
    const fund = makeFund({ id: "goal-long", target_amount: 300_000_000, current_balance: 60_000_000 })
    const c = fundGoalChannel(fund, plan)
    expect(c).not.toBeNull()
    expect(c?.tierKey).toBe("index")
    expect(c?.baseline).toBe(150)
    expect(c?.compoundMonths).not.toBeNull()
    expect(c?.compoundMonths!).toBeLessThan(150)
  })

  it("null baseline → index tier, contribution falls back to ladder weight", () => {
    const fund = makeFund({ id: "goal-nulltl", target_amount: 50_000_000, current_balance: 0 })
    const c = fundGoalChannel(fund, plan)
    expect(c).not.toBeNull()
    expect(c?.baseline).toBeNull()
    expect(c?.tierKey).toBe("index")
  })
})

describe("sumContributedInMonth", () => {
  it("sums only 'in' tx within the month", () => {
    const history = [
      makeTx({ direction: "in", amount: 100_000, transaction_date: "2026-07-05" }),
      makeTx({ direction: "in", amount: 200_000, transaction_date: "2026-07-20" }),
      makeTx({ direction: "out", amount: 50_000, transaction_date: "2026-07-10" }),
      makeTx({ direction: "in", amount: 999_000, transaction_date: "2026-06-30" }),
    ]
    expect(sumContributedInMonth(history, "2026-07")).toBe(300_000)
  })

  it("returns 0 when nothing contributed", () => {
    expect(sumContributedInMonth([], "2026-07")).toBe(0)
  })
})

describe("suggestedContribution", () => {
  // capacityThisMonth 3M; ladderWeights(3) = [0.6, 0.3, 0.1] cho goal-long/short/nulltl.
  const CAP = 3_000_000
  const base = { plan, capacityThisMonth: CAP, contributedThisMonth: 0 }

  it("null when capacity is 0", () => {
    const fund = makeFund({ id: "emergency", fund_type: "emergency" })
    expect(
      suggestedContribution({ fund, plan, emergencyBalance: 5_000_000, capacityThisMonth: 0, contributedThisMonth: 0 }),
    ).toBeNull()
  })

  it("null for fund outside engine (sinking)", () => {
    const fund = makeFund({ id: "s1", fund_type: "sinking" })
    expect(suggestedContribution({ ...base, fund, emergencyBalance: 5_000_000 })).toBeNull()
  })

  it("emergency GĐ1 → 100% capacity", () => {
    const fund = makeFund({ id: "emergency", fund_type: "emergency" })
    expect(suggestedContribution({ ...base, fund, emergencyBalance: 5_000_000 })).toBe(3_000_000)
  })

  it("emergency GĐ2 → 70% capacity", () => {
    const fund = makeFund({ id: "emergency", fund_type: "emergency" })
    expect(suggestedContribution({ ...base, fund, emergencyBalance: 15_000_000 })).toBe(2_100_000)
  })

  it("emergency GĐ3 → null (đã đầy, không gợi ý)", () => {
    const fund = makeFund({ id: "emergency", fund_type: "emergency" })
    expect(suggestedContribution({ ...base, fund, emergencyBalance: 30_000_000 })).toBeNull()
  })

  it("goal GĐ1 → null (100% dồn lá chắn)", () => {
    const fund = makeFund({ id: "goal-long" })
    expect(suggestedContribution({ ...base, fund, emergencyBalance: 5_000_000 })).toBeNull()
  })

  it("goal GĐ2 → 30% × ladder weight theo rank (room dư, không cap)", () => {
    // rank 0 (0.6): 0.3 × 0.6 × 3M = 540k
    expect(
      suggestedContribution({
        ...base,
        fund: makeFund({ id: "goal-long", target_amount: 100_000_000 }),
        emergencyBalance: 15_000_000,
      }),
    ).toBe(540_000)
    // rank 1 (0.3): 0.3 × 0.3 × 3M = 270k
    expect(
      suggestedContribution({
        ...base,
        fund: makeFund({ id: "goal-short", target_amount: 100_000_000 }),
        emergencyBalance: 15_000_000,
      }),
    ).toBe(270_000)
  })

  it("goal GĐ3 → 100% × ladder weight theo rank (room dư)", () => {
    // rank 0 (0.6): 1 × 0.6 × 3M = 1.8M
    expect(
      suggestedContribution({
        ...base,
        fund: makeFund({ id: "goal-long", target_amount: 100_000_000 }),
        emergencyBalance: 30_000_000,
      }),
    ).toBe(1_800_000)
    // rank 2 (0.1): 1 × 0.1 × 3M = 300k
    expect(
      suggestedContribution({
        ...base,
        fund: makeFund({ id: "goal-nulltl", target_amount: 100_000_000 }),
        emergencyBalance: 30_000_000,
      }),
    ).toBe(300_000)
  })

  it("cap tại room của chính quỹ (goal gần đầy)", () => {
    // 0.3 × 0.6 × 3M = 540k nhưng chỉ còn thiếu 100k → cap 100k
    expect(
      suggestedContribution({
        ...base,
        fund: makeFund({ id: "goal-long", target_amount: 10_000_000, current_balance: 9_900_000 }),
        emergencyBalance: 15_000_000,
      }),
    ).toBe(100_000)
  })

  it("null when goal not in plan", () => {
    const fund = makeFund({ id: "missing", target_amount: 50_000_000 })
    expect(suggestedContribution({ ...base, fund, emergencyBalance: 30_000_000 })).toBeNull()
  })

  it("goal đã đạt target (remaining ≤ 0) → null", () => {
    const fund = makeFund({ id: "goal-long", target_amount: 10_000_000, current_balance: 10_000_000 })
    expect(suggestedContribution({ ...base, fund, emergencyBalance: 30_000_000 })).toBeNull()
  })

  it("emergency GĐ2 gần đầy → cap tại room (BR-OB-010)", () => {
    // 0.7 × 10M = 7M nhưng emergency chỉ còn thiếu 500k → cap 500k
    expect(
      suggestedContribution({
        fund: makeFund({ id: "emergency", fund_type: "emergency" }),
        plan,
        emergencyBalance: 29_500_000,
        capacityThisMonth: 10_000_000,
        contributedThisMonth: 0,
      }),
    ).toBe(500_000)
  })

  it("trừ contributedThisMonth", () => {
    const fund = makeFund({ id: "emergency", fund_type: "emergency" })
    expect(
      suggestedContribution({ ...base, fund, emergencyBalance: 5_000_000, contributedThisMonth: 1_000_000 }),
    ).toBe(2_000_000)
  })

  it("sàn 0 khi đã góp vượt gợi ý", () => {
    const fund = makeFund({ id: "emergency", fund_type: "emergency" })
    expect(
      suggestedContribution({ ...base, fund, emergencyBalance: 5_000_000, contributedThisMonth: 5_000_000 }),
    ).toBe(0)
  })
})

describe("suggestedContribution — incomplete goals only (mirror pourGoals)", () => {
  // Kế hoạch có 1 goal đã đầy (timelineMonths 0) + 1 goal còn dở.
  const planDone: AllocationPlan = {
    capacityMonthly: 3_000_000,
    emergencyTarget: 30_000_000,
    stage1EndMonth: 0,
    stage2EndMonth: 0,
    allocations: [
      { id: "emergency", monthlyAmount: 0, timelineMonths: 0 },
      { id: "goal-done", monthlyAmount: 0, timelineMonths: 0 },
      { id: "goal-active", monthlyAmount: 1_000_000, timelineMonths: 100 },
    ],
  }

  it("goal duy nhất còn dở → nhận 100% pool (ladderWeights(1) = [1])", () => {
    // GĐ3 (emergency đầy), goalPortion 1, weight 1 → 1 × 3M = 3M (room dư)
    expect(
      suggestedContribution({
        fund: makeFund({ id: "goal-active", target_amount: 100_000_000 }),
        plan: planDone,
        emergencyBalance: 30_000_000,
        capacityThisMonth: 3_000_000,
        contributedThisMonth: 0,
      }),
    ).toBe(3_000_000)
  })

  it("goal đã đầy (timelineMonths 0 + remaining ≤ 0) → null", () => {
    expect(
      suggestedContribution({
        fund: makeFund({ id: "goal-done", target_amount: 5_000_000, current_balance: 5_000_000 }),
        plan: planDone,
        emergencyBalance: 30_000_000,
        capacityThisMonth: 3_000_000,
        contributedThisMonth: 0,
      }),
    ).toBeNull()
  })

  it("emergency GĐ2 nhưng hết goal dở → nhận 100% (không phải 70%)", () => {
    const planGoalsDone: AllocationPlan = {
      capacityMonthly: 3_000_000,
      emergencyTarget: 30_000_000,
      stage1EndMonth: 0,
      stage2EndMonth: 8,
      allocations: [
        { id: "emergency", monthlyAmount: 1_000_000, timelineMonths: 8 },
        { id: "goal-x", monthlyAmount: 0, timelineMonths: 0 },
      ],
    }
    // stage 2 (15M ∈ [10M,30M)), không còn goal dở → share 1 → min(3M, room 15M) = 3M
    expect(
      suggestedContribution({
        fund: makeFund({ id: "emergency", fund_type: "emergency" }),
        plan: planGoalsDone,
        emergencyBalance: 15_000_000,
        capacityThisMonth: 3_000_000,
        contributedThisMonth: 0,
      }),
    ).toBe(3_000_000)
  })
})

describe("hasContributedInMonth", () => {
  it("true when an 'in' tx falls in the month", () => {
    expect(hasContributedInMonth([makeTx({ transaction_date: "2026-07-05" })], "2026-07")).toBe(true)
  })

  it("false when only withdrawals in the month", () => {
    expect(hasContributedInMonth([makeTx({ direction: "out", transaction_date: "2026-07-05" })], "2026-07")).toBe(false)
  })

  it("false when contribution is in a different month", () => {
    expect(hasContributedInMonth([makeTx({ transaction_date: "2026-06-30" })], "2026-07")).toBe(false)
  })
})
