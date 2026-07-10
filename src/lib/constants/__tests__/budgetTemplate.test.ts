import { describe, it, expect } from "vitest"
import {
  BUDGET_TEMPLATE,
  SPENDING_COST_TYPE_GROUPS,
  estimateEmergencyTarget,
  calculateAllocationPlan,
  calculateTodayRemaining,
  ladderWeights,
  COMPOUND_TIERS,
  COMPOUND_RATES_YEAR,
  compoundTimelineMonths,
  pickCompoundTier,
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

describe("calculateAllocationPlan", () => {
  const goal = (id: string, targetAmount: number, initialBalance = 0) => ({
    id,
    targetAmount,
    initialBalance,
  })

  it("capacity = 15% thu nhập, derive từ BUDGET_TEMPLATE (không hardcode)", () => {
    const plan = calculateAllocationPlan({ monthlyIncome: 20_000_000, goals: [] })
    expect(plan.capacityMonthly).toBe(3_000_000)
    expect(plan.emergencyTarget).toBe(estimateEmergencyTarget(20_000_000))
  })

  it("0 quỹ mục tiêu: 100% capacity → emergency mọi giai đoạn", () => {
    // income 20tr: capacity 3tr, essential 16.2tr, target 48.6tr
    const plan = calculateAllocationPlan({ monthlyIncome: 20_000_000, goals: [] })
    expect(plan.allocations).toHaveLength(1)
    const em = plan.allocations[0]
    expect(em.id).toBe("emergency")
    // góp trung bình = target 48.6tr / timeline 17 tháng
    expect(em.monthlyAmount).toBe(2_858_824)
    // stage1 (16.2tr): tháng 6 (5×3=15tr chưa đủ, tháng 6 → 18tr)
    expect(plan.stage1EndMonth).toBe(6)
    // không goal → GĐ2 dồn 100% emergency: 48.6tr / 3tr = 16.2 → tháng 17
    expect(plan.stage2EndMonth).toBe(17)
    expect(em.timelineMonths).toBe(17)
  })

  it("income 15tr, 3 quỹ: emergency ưu tiên (GĐ1), mọi quỹ hoàn thành hữu hạn", () => {
    const plan = calculateAllocationPlan({
      monthlyIncome: 15_000_000,
      goals: [goal("a", 30_000_000), goal("b", 20_000_000), goal("c", 10_000_000)],
    })
    // capacity 2.25tr < stage1Threshold (12.15tr) → GĐ1 dồn emergency trước
    expect(plan.capacityMonthly).toBe(2_250_000)
    // monthlyAmount = góp trung bình = (target − initial) / timeline
    expect(plan.allocations[0].monthlyAmount).toBe(1_733_333)
    expect(plan.allocations.every((a) => a.timelineMonths !== null)).toBe(true)
    // emergency xong trước goal hạng 1 (ưu tiên GĐ1/GĐ2)
    expect(plan.allocations[0].timelineMonths!).toBeLessThan(plan.allocations[1].timelineMonths!)
  })

  it("income 40tr (biên AC3): capacity = 15% = 6tr, mọi quỹ hoàn thành hữu hạn", () => {
    const plan = calculateAllocationPlan({
      monthlyIncome: 40_000_000,
      goals: [goal("a", 100_000_000), goal("b", 50_000_000)],
    })
    expect(plan.capacityMonthly).toBe(6_000_000)
    expect(plan.emergencyTarget).toBe(97_200_000)
    // emergency góp trung bình = 97.2tr / timeline 21
    expect(plan.allocations[0].monthlyAmount).toBe(4_628_571)
    expect(plan.allocations.every((a) => a.timelineMonths !== null)).toBe(true)
  })

  it("income 100tr: mọi quỹ hoàn thành, timeline hữu hạn và tăng dần theo hạng", () => {
    const plan = calculateAllocationPlan({
      monthlyIncome: 100_000_000,
      goals: [goal("a", 50_000_000), goal("b", 50_000_000)],
    })
    expect(plan.allocations.every((a) => a.timelineMonths !== null)).toBe(true)
    expect(plan.stage2EndMonth).not.toBeNull()
  })

  describe("bậc thang theo hạng (emergency đã đầy → GĐ3 100% goals)", () => {
    const full = estimateEmergencyTarget(100_000_000)

    it("1 quỹ [100]: 900tr / 15tr = 60 tháng đúng → góp trung bình = capacity", () => {
      const plan = calculateAllocationPlan({
        monthlyIncome: 100_000_000,
        emergencyBalance: full,
        goals: [goal("a", 900_000_000)],
      })
      expect(plan.allocations[1].monthlyAmount).toBe(15_000_000)
      expect(plan.allocations[1].timelineMonths).toBe(60)
    })

    it("2 quỹ [70,30]: hạng cao xong trước, góp trung bình theo timeline riêng", () => {
      const plan = calculateAllocationPlan({
        monthlyIncome: 100_000_000,
        emergencyBalance: full,
        goals: [goal("a", 900_000_000), goal("b", 900_000_000)],
      })
      expect(plan.allocations[1].monthlyAmount).toBe(10_465_116)
      expect(plan.allocations[1].timelineMonths).toBe(86)
      expect(plan.allocations[2].monthlyAmount).toBe(7_500_000)
      expect(plan.allocations[2].timelineMonths).toBe(120)
    })

    it("ladderWeights: 70/30, 60/30/10, N≥4 chia đều 10% cho hạng 3..N", () => {
      expect(ladderWeights(1)).toEqual([1])
      expect(ladderWeights(2)).toEqual([0.7, 0.3])
      expect(ladderWeights(3)).toEqual([0.6, 0.3, 0.1])
      expect(ladderWeights(4)).toEqual([0.6, 0.3, 0.05, 0.05])
      expect(ladderWeights(5)).toEqual([0.6, 0.3, 0.1 / 3, 0.1 / 3, 0.1 / 3])
    })

    it("5 goals + emergency = 6 quỹ (ladder N=5)", () => {
      const plan = calculateAllocationPlan({
        monthlyIncome: 100_000_000,
        emergencyBalance: full,
        goals: [goal("a", 9e9), goal("b", 9e9), goal("c", 9e9), goal("d", 9e9), goal("e", 9e9)],
      })
      expect(plan.allocations).toHaveLength(6)
      expect(plan.allocations[0].id).toBe("emergency")
    })
  })

  it("goal xong giữa tháng → phần dư redistribute sang quỹ còn lại (spill-over)", () => {
    // GĐ3, capacity 15tr, ladder [70,30]: a cần 5tr (đầy ngay) → 10tr dư dồn sang b
    const plan = calculateAllocationPlan({
      monthlyIncome: 100_000_000,
      emergencyBalance: estimateEmergencyTarget(100_000_000),
      goals: [goal("a", 5_000_000), goal("b", 900_000_000)],
    })
    expect(plan.allocations[1].monthlyAmount).toBe(5_000_000)
    expect(plan.allocations[1].timelineMonths).toBe(1)
    // b nhận 30% + 10tr spill tháng 1 rồi 100% → xong tháng 61, góp trung bình
    expect(plan.allocations[2].monthlyAmount).toBe(14_754_098)
    expect(plan.allocations[2].timelineMonths).toBe(61)
  })

  it("emergency GĐ2 (đã đầy 1× essential): 70% emergency / 30% goals", () => {
    // income 20tr: capacity 3tr, essential 16.2tr → bắt đầu GĐ2
    const plan = calculateAllocationPlan({
      monthlyIncome: 20_000_000,
      emergencyBalance: 16_200_000,
      goals: [goal("a", 100_000_000)],
    })
    expect(plan.stage1EndMonth).toBe(0) // đã đạt 1× ngay từ đầu
    // góp trung bình = (target − initial) / timeline (GĐ2 70/30 phản ánh trong timeline)
    expect(plan.allocations[0].monthlyAmount).toBe(2_025_000)
    expect(plan.allocations[1].monthlyAmount).toBe(2_222_222)
  })

  it("emergency đã đầy hoàn toàn → stage ends = 0, timeline emergency 0", () => {
    const plan = calculateAllocationPlan({
      monthlyIncome: 20_000_000,
      emergencyBalance: estimateEmergencyTarget(20_000_000),
      goals: [],
    })
    expect(plan.stage1EndMonth).toBe(0)
    expect(plan.stage2EndMonth).toBe(0)
    expect(plan.allocations[0].timelineMonths).toBe(0)
  })

  it("timeline > 600 tháng → null", () => {
    // income tối thiểu, quỹ khổng lồ: không bao giờ đạt trong 600 tháng
    const plan = calculateAllocationPlan({
      monthlyIncome: 100_000,
      goals: [goal("a", 10_000_000_000)],
    })
    expect(plan.allocations[1].timelineMonths).toBeNull()
  })

  it("timeline biên chính xác 600 tháng: khít 600 → 600, quá 1 tháng góp → null", () => {
    const full = estimateEmergencyTarget(100_000_000)
    // capacity 15tr, emergency đầy sẵn → 15tr × 600 = 9e9 xong đúng tháng 600
    const exact = calculateAllocationPlan({
      monthlyIncome: 100_000_000,
      emergencyBalance: full,
      goals: [goal("a", 9_000_000_000)],
    })
    expect(exact.allocations[1].timelineMonths).toBe(600)
    expect(exact.allocations[1].monthlyAmount).toBe(15_000_000)
    // thêm đúng 1 tháng góp (15tr) → cần tháng 601 > 600 → null
    const over = calculateAllocationPlan({
      monthlyIncome: 100_000_000,
      emergencyBalance: full,
      goals: [goal("a", 9_015_000_000)],
    })
    expect(over.allocations[1].timelineMonths).toBeNull()
    expect(over.allocations[1].monthlyAmount).toBeNull()
  })

  it("income 0 (capacity 0): emergency góp 0 (target 0 đã đầy), goal null timeline null", () => {
    const plan = calculateAllocationPlan({
      monthlyIncome: 0,
      goals: [goal("a", 1_000_000)],
    })
    expect(plan.capacityMonthly).toBe(0)
    expect(plan.allocations[0].monthlyAmount).toBe(0)
    expect(plan.allocations[1].monthlyAmount).toBeNull()
    expect(plan.allocations[1].timelineMonths).toBeNull()
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

describe("COMPOUND_TIERS config (BR-OB-013)", () => {
  it("3 tầng 5/6,5/8% năm tham chiếu 2025", () => {
    expect(COMPOUND_RATES_YEAR).toBe(2025)
    expect(COMPOUND_TIERS.map((tt) => tt.annualRate)).toEqual([0.05, 0.065, 0.08])
    expect(COMPOUND_TIERS.map((tt) => tt.maxMonths)).toEqual([24, 60, Infinity])
    expect(COMPOUND_TIERS.map((tt) => tt.key)).toEqual(["savings", "bonds", "index"])
  })
})

describe("compoundTimelineMonths", () => {
  it("case tay: 10tr/tháng, 8%/năm, target 500tr → 44 tháng", () => {
    expect(compoundTimelineMonths(10_000_000, 500_000_000, 0.08)).toBe(44)
  })

  it("cùng target rate cao → n nhỏ hơn (monotonic)", () => {
    const high = compoundTimelineMonths(10_000_000, 500_000_000, 0.08)
    const low = compoundTimelineMonths(10_000_000, 500_000_000, 0.05)
    expect(high).toBe(44)
    expect(low).toBe(46)
    expect(high! < low!).toBe(true)
  })

  it("C ≤ 0 → null", () => {
    expect(compoundTimelineMonths(0, 500_000_000, 0.08)).toBeNull()
    expect(compoundTimelineMonths(-1, 500_000_000, 0.08)).toBeNull()
  })

  it("target ≤ 0 → 0", () => {
    expect(compoundTimelineMonths(10_000_000, 0, 0.08)).toBe(0)
    expect(compoundTimelineMonths(10_000_000, -5, 0.08)).toBe(0)
  })

  it("không đạt trong cap 600 → null", () => {
    expect(compoundTimelineMonths(1_000, 1_000_000_000_000, 0.05)).toBeNull()
  })

  it("một kỳ góp đủ → 1 tháng (biên n nhỏ nhất)", () => {
    expect(compoundTimelineMonths(500, 500, 0.05)).toBe(1)
  })
})

describe("pickCompoundTier — biên 23/24/60/61 + null", () => {
  it("≤24 tháng → savings 5%", () => {
    expect(pickCompoundTier(23).key).toBe("savings")
    expect(pickCompoundTier(24).key).toBe("savings")
    expect(pickCompoundTier(24).annualRate).toBe(0.05)
  })

  it("25-60 tháng → bonds 6,5%", () => {
    expect(pickCompoundTier(25).key).toBe("bonds")
    expect(pickCompoundTier(60).key).toBe("bonds")
    expect(pickCompoundTier(60).annualRate).toBe(0.065)
  })

  it(">60 tháng → index 8%", () => {
    expect(pickCompoundTier(61).key).toBe("index")
    expect(pickCompoundTier(61).annualRate).toBe(0.08)
  })

  it("null (ngoài cap) → index 8%", () => {
    expect(pickCompoundTier(null).key).toBe("index")
  })
})
