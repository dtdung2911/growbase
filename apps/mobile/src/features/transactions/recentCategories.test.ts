import type { CategoryGroupWithCategories } from "@growbase/shared/types/category"
import { describe, expect, it } from "vitest"
import {
  filterByDirection,
  pushRecent,
  recentCategoriesFor,
} from "@/features/transactions/recentCategories"

function group(id: string, code: string | null, catIds: string[]): CategoryGroupWithCategories {
  return {
    id,
    name: id,
    icon: null,
    color: null,
    cost_type_id: null,
    cost_type_code: code,
    is_system: false,
    categories: catIds.map((c) => ({
      id: c,
      name: c,
      icon: null,
      default_behavior_type: "essential",
      is_system: false,
    })),
  }
}

describe("pushRecent", () => {
  it("prepends, dedupes, and caps at 6 most-recent-first", () => {
    let ids: string[] = []
    for (const id of ["a", "b", "c"]) ids = pushRecent(ids, id)
    expect(ids).toEqual(["c", "b", "a"])

    ids = pushRecent(ids, "a")
    expect(ids).toEqual(["a", "c", "b"])

    for (const id of ["d", "e", "f", "g", "h"]) ids = pushRecent(ids, id)
    expect(ids).toHaveLength(6)
    expect(ids[0]).toBe("h")
  })
})

describe("filterByDirection", () => {
  const groups = [group("g-inc", "income", ["salary"]), group("g-exp", "living", ["food"])]

  it("income → only cost_type_code income groups", () => {
    expect(filterByDirection(groups, "in").map((g) => g.id)).toEqual(["g-inc"])
  })

  it("expense → every non-income group (including null code)", () => {
    const withNull = [...groups, group("g-null", null, ["misc"])]
    expect(filterByDirection(withNull, "out").map((g) => g.id)).toEqual(["g-exp", "g-null"])
  })
})

describe("recentCategoriesFor", () => {
  it("returns categories present in groups, ordered by recentIds", () => {
    const groups = [group("g", "living", ["food", "rent"])]
    expect(recentCategoriesFor(groups, ["rent", "gone", "food"]).map((c) => c.id)).toEqual([
      "rent",
      "food",
    ])
  })
})
