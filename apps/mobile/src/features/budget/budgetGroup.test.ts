import type { BudgetActualLine } from "@growbase/shared/types/app"
import { describe, expect, it } from "vitest"
import { budgetLineStatus, clampPct, groupBudgetLines } from "./budgetGroup"

function line(name: string, budget: number, actual: number): BudgetActualLine {
  return {
    cost_type_id: name,
    cost_type_code: name,
    cost_type_name: name,
    budget_pct: 0,
    override_pct: null,
    effective_pct: 0,
    budget_amount: budget,
    actual_amount: actual,
    remaining: budget - actual,
    usage_pct: budget > 0 ? (actual / budget) * 100 : 0,
  }
}

describe("groupBudgetLines", () => {
  it("groups lines and orders groups by BUDGET_GROUP_ORDER regardless of input order", () => {
    const groups = groupBudgetLines([
      line("Giải trí", 100, 50), // wasteful
      line("Chăm sóc cá nhân", 100, 50), // variable
      line("Nhà ở & Điện nước", 100, 50), // fixed
      line("Đầu tư", 100, 50), // savings_investment
    ])
    expect(groups.map((g) => g.key)).toEqual(["fixed", "variable", "wasteful", "savings_investment"])
  })

  it("drops groups that have no lines", () => {
    const groups = groupBudgetLines([line("Nhà ở & Điện nước", 100, 50)])
    expect(groups.map((g) => g.key)).toEqual(["fixed"])
    expect(groups.some((g) => g.key === "variable")).toBe(false)
  })

  it("drops lines whose name is not in the template", () => {
    const groups = groupBudgetLines([
      line("Nhà ở & Điện nước", 100, 50),
      line("Không tồn tại", 999, 999),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].lines.map((l) => l.cost_type_name)).toEqual(["Nhà ở & Điện nước"])
  })

  it("sums per-group totals across multiple lines", () => {
    const groups = groupBudgetLines([
      line("Nhà ở & Điện nước", 100, 40),
      line("Phương tiện", 300, 60),
    ])
    const fixed = groups[0]
    expect(fixed.budgetAmount).toBe(400)
    expect(fixed.actualAmount).toBe(100)
    expect(fixed.remaining).toBe(300)
    expect(fixed.usagePct).toBe(25)
  })

  it("returns usagePct 0 when group budget is 0 (no divide-by-zero)", () => {
    const groups = groupBudgetLines([line("Nhà ở & Điện nước", 0, 500)])
    expect(groups[0].usagePct).toBe(0)
    expect(groups[0].remaining).toBe(-500)
  })
})

describe("budgetLineStatus", () => {
  it("maps usage to thresholds at the boundaries", () => {
    expect(budgetLineStatus(0)).toBe("safe")
    expect(budgetLineStatus(79)).toBe("safe")
    expect(budgetLineStatus(80)).toBe("warning")
    expect(budgetLineStatus(99)).toBe("warning")
    expect(budgetLineStatus(100)).toBe("over")
    expect(budgetLineStatus(150)).toBe("over")
  })
})

describe("clampPct", () => {
  it("clamps to 0..100 and guards non-finite input", () => {
    expect(clampPct(-10)).toBe(0)
    expect(clampPct(50)).toBe(50)
    expect(clampPct(120)).toBe(100)
    expect(clampPct(Number.NaN)).toBe(0)
    expect(clampPct(Number.POSITIVE_INFINITY)).toBe(0)
  })
})
