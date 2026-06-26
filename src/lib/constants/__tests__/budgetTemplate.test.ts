import { describe, it, expect } from "vitest"
import { BUDGET_TEMPLATE } from "@/lib/constants/budgetTemplate"

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
