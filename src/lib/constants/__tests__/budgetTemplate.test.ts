import { describe, it, expect } from "vitest"
import {
  BUDGET_TEMPLATE,
  SPENDING_COST_TYPE_GROUPS,
  estimateEmergencyTarget,
  calculateFeasibility,
  calculateAggregateFeasibility,
  calculateTodayRemaining,
} from "@/lib/constants/budgetTemplate"

describe("BUDGET_TEMPLATE", () => {
  it("contains exactly 18 lines", () => {
    expect(BUDGET_TEMPLATE).toHaveLength(18)
  })

  it("has budgetPct totalling exactly 100", () => {
    const total = BUDGET_TEMPLATE.reduce((sum, line) => sum + line.budgetPct, 0)
    expect(total).toBe(100)
  })

  it("every line has the required fields with valid types", () => {
    for (const line of BUDGET_TEMPLATE) {
      expect(typeof line.name).toBe("string")
      expect(line.name.length).toBeGreaterThan(0)
      expect(typeof line.budgetPct).toBe("number")
      expect(line.budgetPct).toBeGreaterThanOrEqual(0)
      expect(typeof line.sortOrder).toBe("number")
      expect(line.isSystem).toBe(true)
      expect(Array.isArray(line.linkedCategoryGroupNames)).toBe(true)
    }
  })

  it("has unique names", () => {
    const names = BUDGET_TEMPLATE.map((l) => l.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("has a contiguous sortOrder from 1..18 with no gaps/duplicates", () => {
    const orders = BUDGET_TEMPLATE.map((l) => l.sortOrder).sort((a, b) => a - b)
    expect(orders).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
  })

  it("marks every line as a system entity (BR-SY-001)", () => {
    expect(BUDGET_TEMPLATE.every((l) => l.isSystem === true)).toBe(true)
  })

  describe("auto-calculated line", () => {
    it("has exactly one auto-calculated line", () => {
      const autos = BUDGET_TEMPLATE.filter((l) => l.isAutoCalculated)
      expect(autos).toHaveLength(1)
    })

    it("the only auto-calculated line is 'Chi trả nợ'", () => {
      const auto = BUDGET_TEMPLATE.find((l) => l.isAutoCalculated)
      expect(auto?.name).toBe("Chi trả nợ")
    })

    it("'Chi trả nợ' sources from debt_entries", () => {
      const debt = BUDGET_TEMPLATE.find((l) => l.name === "Chi trả nợ")
      expect(debt?.isAutoCalculated).toBe(true)
      expect(debt?.autoCalculatedSource).toBe("debt_entries")
    })

    it("no line other than 'Chi trả nợ' is auto-calculated", () => {
      for (const line of BUDGET_TEMPLATE) {
        if (line.name !== "Chi trả nợ") {
          expect(line.isAutoCalculated).toBeFalsy()
          expect(line.autoCalculatedSource).toBeUndefined()
        }
      }
    })
  })

  describe("linkedCategoryGroupNames", () => {
    it("every line has at least one linked category group", () => {
      for (const line of BUDGET_TEMPLATE) {
        expect(line.linkedCategoryGroupNames.length).toBeGreaterThanOrEqual(1)
      }
    })

    it("'Phương tiện' links both fixed and variable vehicle groups", () => {
      const transport = BUDGET_TEMPLATE.find((l) => l.name === "Phương tiện")
      expect(transport?.linkedCategoryGroupNames).toEqual([
        "Phương tiện xe cơ cố định",
        "Phương tiện xe cơ phát sinh",
      ])
    })
  })
})

describe("estimateEmergencyTarget", () => {
  it("= 3 × income × tổng pct chi tiêu (fixed+variable+wasteful+debt_repayment = 81%)", () => {
    // 3 × 20tr × 0.81 = 48.6tr — đã là bội 100k
    expect(estimateEmergencyTarget(20_000_000)).toBe(48_600_000)
  })

  it("làm tròn xuống bội 100.000đ", () => {
    // 3 × 10.137.000 × 0.81 = 24.632.910 → 24.600.000
    expect(estimateEmergencyTarget(10_137_000)).toBe(24_600_000)
  })

  it("income 0 → 0", () => {
    expect(estimateEmergencyTarget(0)).toBe(0)
  })

  it("pct chi tiêu derive từ BUDGET_TEMPLATE, không hardcode", () => {
    const spendingPct = BUDGET_TEMPLATE.filter((l) =>
      SPENDING_COST_TYPE_GROUPS.includes(l.costTypeGroup)
    ).reduce((sum, l) => sum + l.budgetPct, 0)
    expect(spendingPct).toBe(81)
  })
})

describe("calculateFeasibility", () => {
  // income 20tr, chi tiêu 81% = 16.2tr → available = 3.8tr
  it("feasible khi monthlyNeeded <= available", () => {
    const result = calculateFeasibility(45_600_000, 12, 20_000_000)
    expect(result.available).toBeCloseTo(3_800_000)
    expect(result.monthlyNeeded).toBe(3_800_000)
    expect(result.feasible).toBe(true)
  })

  it("không feasible khi monthlyNeeded > available", () => {
    const result = calculateFeasibility(100_000_000, 12, 20_000_000)
    expect(result.feasible).toBe(false)
  })

  it("số tháng lẻ tính đúng phép chia", () => {
    const result = calculateFeasibility(10_000_000, 3, 20_000_000)
    expect(result.monthlyNeeded).toBeCloseTo(10_000_000 / 3)
  })

  it("target 0 → monthlyNeeded 0, luôn feasible", () => {
    const result = calculateFeasibility(0, 12, 20_000_000)
    expect(result.monthlyNeeded).toBe(0)
    expect(result.feasible).toBe(true)
  })
})

describe("calculateTodayRemaining", () => {
  const flexiblePct = BUDGET_TEMPLATE.filter((l) => ["variable", "wasteful"].includes(l.costTypeGroup)).reduce(
    (sum, l) => sum + l.budgetPct,
    0
  )

  it("chia đều theo số ngày trong tháng", () => {
    const jan2026 = new Date(2026, 0, 15) // 31 ngày
    const income = 20_000_000
    const expected = Math.floor((income * (flexiblePct / 100)) / 31)
    expect(calculateTodayRemaining(income, jan2026)).toBe(expected)
  })

  it("tháng 28 ngày (Feb 2026, không nhuận) tính khác tháng 31 ngày", () => {
    const income = 20_000_000
    const feb2026 = new Date(2026, 1, 10)
    const jan2026 = new Date(2026, 0, 10)
    expect(calculateTodayRemaining(income, feb2026)).toBeGreaterThan(calculateTodayRemaining(income, jan2026))
  })

  it("income 0 → 0", () => {
    expect(calculateTodayRemaining(0, new Date(2026, 0, 15))).toBe(0)
  })
})

describe("calculateAggregateFeasibility", () => {
  it("cộng dồn monthlyNeeded của cả list", () => {
    const r = calculateAggregateFeasibility([1_000_000, 2_000_000, 500_000], 10_000_000)
    expect(r.monthlyNeeded).toBe(3_500_000)
    expect(r.available).toBe(10_000_000)
    expect(r.feasible).toBe(true)
  })

  it("list rỗng → monthlyNeeded 0, feasible", () => {
    const r = calculateAggregateFeasibility([], 5_000_000)
    expect(r.monthlyNeeded).toBe(0)
    expect(r.feasible).toBe(true)
  })

  it("epsilon boundary: total == available + 1 vẫn feasible", () => {
    const r = calculateAggregateFeasibility([5_000_001], 5_000_000)
    expect(r.feasible).toBe(true)
  })

  it("total > available + 1 → không feasible", () => {
    const r = calculateAggregateFeasibility([5_000_002], 5_000_000)
    expect(r.feasible).toBe(false)
  })
})
