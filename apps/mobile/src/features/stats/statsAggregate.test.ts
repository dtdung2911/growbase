import type { TransactionWithJoins } from "@growbase/shared/types/app"
import type { CategoryGroupWithCategories } from "@growbase/shared/types/category"
import { describe, expect, it } from "vitest"
import { aggregateByCategory, aggregateByGroup, topNWithOther } from "@/features/stats/statsAggregate"

function tx(over: Partial<TransactionWithJoins>): TransactionWithJoins {
  return {
    id: Math.random().toString(),
    household_id: "h",
    member_id: "m",
    amount: 0,
    direction: "out",
    transaction_type: "expense",
    category_id: "c1",
    account_id: "a1",
    fund_id: null,
    debt_entry_id: null,
    behavior_type: null,
    is_unusual_income: false,
    exclude_from_budget_report: false,
    description: null,
    transaction_date: "2026-07-01",
    created_at: "",
    updated_at: "",
    category: { id: "c1", name: "Ăn uống", icon: "🍜" },
    account: null,
    ...over,
  }
}

const GROUPS: CategoryGroupWithCategories[] = [
  {
    id: "g1",
    name: "Thiết yếu",
    icon: null,
    color: null,
    cost_type_id: null,
    cost_type_code: null,
    is_system: false,
    categories: [
      { id: "c1", name: "Ăn uống", icon: "🍜", default_behavior_type: "fixed", is_system: false },
      { id: "c2", name: "Đi lại", icon: "🚕", default_behavior_type: "fixed", is_system: false },
    ],
  },
]

describe("aggregateByCategory", () => {
  it("returns empty when only income (or excluded)", () => {
    const txns = [
      tx({ direction: "in", amount: 100 }),
      tx({ direction: "out", amount: 50, exclude_from_budget_report: true }),
    ]
    expect(aggregateByCategory(txns, "Khác")).toEqual([])
  })

  it("buckets null category into Khác", () => {
    const slices = aggregateByCategory([tx({ amount: 100, category: null, category_id: "gone" })], "Khác")
    expect(slices).toHaveLength(1)
    expect(slices[0].name).toBe("Khác")
    expect(slices[0].amount).toBe(100)
  })

  it("groups by category, sorts desc, pct sums to 100", () => {
    const slices = aggregateByCategory(
      [
        tx({ amount: 30, category: { id: "c1", name: "Ăn uống", icon: "🍜" } }),
        tx({ amount: 70, category: { id: "c2", name: "Đi lại", icon: "🚕" }, category_id: "c2" }),
      ],
      "Khác",
    )
    expect(slices.map((s) => s.name)).toEqual(["Đi lại", "Ăn uống"])
    expect(slices.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(100)
  })
})

describe("aggregateByGroup", () => {
  it("maps category to group; unmapped goes to Khác", () => {
    const slices = aggregateByGroup(
      [
        tx({ amount: 40, category_id: "c1" }),
        tx({ amount: 60, category_id: "unknown", category: null }),
      ],
      GROUPS,
      "Khác",
    )
    expect(slices.map((s) => s.name)).toEqual(["Khác", "Thiết yếu"])
    expect(slices.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(100)
  })

  it("keys on category_id (not the join) so a null join buckets identically to category chart", () => {
    const txns = [tx({ amount: 100, category_id: "c1", category: null })]
    const catSlices = aggregateByCategory(txns, "Khác")
    const groupSlices = aggregateByGroup(txns, GROUPS, "Khác")
    expect(catSlices).toHaveLength(1)
    expect(catSlices[0].key).toBe("c1")
    expect(groupSlices).toHaveLength(1)
    expect(groupSlices[0].name).toBe("Thiết yếu")
  })
})

describe("topNWithOther", () => {
  it("keeps list untouched when at or below n", () => {
    const slices = aggregateByCategory([tx({ amount: 100 })], "Khác")
    expect(topNWithOther(slices, 6, "Khác")).toBe(slices)
  })

  it("collapses the tail into a single Khác slice", () => {
    const slices = aggregateByCategory(
      Array.from({ length: 8 }, (_, i) =>
        tx({ amount: 10, category_id: `c${i}`, category: { id: `c${i}`, name: `Cat ${i}`, icon: null } }),
      ),
      "Khác",
    )
    const capped = topNWithOther(slices, 6, "Khác")
    expect(capped).toHaveLength(7)
    expect(capped[6].name).toBe("Khác")
    expect(capped[6].amount).toBe(20)
    expect(capped.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(100)
  })

  it("merges an uncategorized bucket with the topN overflow into one Khác slice", () => {
    const named = Array.from({ length: 7 }, (_, i) =>
      tx({ amount: 10, category_id: `c${i}`, category: { id: `c${i}`, name: `Cat ${i}`, icon: null } }),
    )
    const uncategorized = [tx({ amount: 8, category: null, category_id: undefined })]
    const capped = topNWithOther(aggregateByCategory([...named, ...uncategorized], "Khác"), 6, "Khác")
    const keys = capped.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(capped.filter((s) => s.name === "Khác")).toHaveLength(1)
    expect(capped[capped.length - 1].name).toBe("Khác")
    expect(capped[capped.length - 1].amount).toBe(18)
  })
})
