import { describe, it, expect } from "vitest"
import {
  buildHookDemoData,
  HOOK_DEMO_MONTH,
  HOOK_DEMO_MONTHLY_INCOME,
  HOOK_DEMO_TODAY_REFERENCE,
} from "@/components/onboarding/v2/hookDemoData"
import { calculateTodayRemaining } from "@/lib/constants/budgetTemplate"

const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${JSON.stringify(vars)}` : key

describe("buildHookDemoData", () => {
  const data = buildHookDemoData(t, "vi")

  it("totalIncome khớp HOOK_DEMO_MONTHLY_INCOME (không phải số bịa riêng)", () => {
    expect(data.totalIncome).toBe(HOOK_DEMO_MONTHLY_INCOME)
  })

  it("budgetLines: budget_pct cộng lại đúng 100", () => {
    const total = data.budgetLines.reduce((sum, line) => sum + line.budget_pct, 0)
    expect(total).toBe(100)
  })

  it("budgetLines: actual_amount mỗi dòng derive từ giao dịch, tổng lại đúng totalExpense", () => {
    const total = data.budgetLines.reduce((sum, line) => sum + line.actual_amount, 0)
    expect(total).toBe(data.totalExpense)
  })

  it("weekdaySpending: đủ 7 ngày, tổng amount đúng totalExpense", () => {
    expect(data.weekdaySpending).toHaveLength(7)
    const total = data.weekdaySpending.reduce((sum, w) => sum + w.amount, 0)
    expect(total).toBe(data.totalExpense)
  })

  it("spendingByBehavior: percentage cộng lại đúng 100", () => {
    const total = data.spendingByBehavior.reduce((sum, s) => sum + s.percentage, 0)
    expect(total).toBeCloseTo(100, 0)
  })

  it("topExpenseCategories: sắp giảm dần theo amount", () => {
    for (let i = 1; i < data.topExpenseCategories.length; i++) {
      expect(data.topExpenseCategories[i - 1].amount).toBeGreaterThanOrEqual(data.topExpenseCategories[i].amount)
    }
  })

  it("quỹ 'Quỹ học cho bé Na' đạt 43% (AC2)", () => {
    const goalFund = data.funds.find((f) => f.fund_type === "goal")
    expect(goalFund).toBeDefined()
    const pct = Math.round(((goalFund!.current_balance / goalFund!.target_amount!) * 100))
    expect(pct).toBe(43)
  })

  it("recentTransactions: mọi description đã qua t() (NFR1)", () => {
    expect(data.recentTransactions.length).toBeGreaterThan(0)
    for (const tx of data.recentTransactions) {
      expect(tx.description).toMatch(/^setupV2\.hook\.demo\.tx\./)
    }
  })

  it("recentTransactions: category name giữ nguyên, KHÔNG chạy qua t() (khớp hành vi app thật)", () => {
    const groceries = data.recentTransactions.find((tx) => tx.category?.name === "Thực phẩm & Ăn uống hàng ngày")
    expect(groceries).toBeDefined()
  })

  it("tháng của dashboard demo là HOOK_DEMO_MONTH", () => {
    expect(HOOK_DEMO_MONTH).toBe("2026-06")
  })

  it("'Hôm nay còn 85.000đ chi tiêu thoải mái' (AC2) — dùng chung công thức calculateTodayRemaining thật", () => {
    expect(calculateTodayRemaining(HOOK_DEMO_MONTHLY_INCOME, HOOK_DEMO_TODAY_REFERENCE)).toBe(85_000)
  })
})
