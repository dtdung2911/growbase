import { describe, expect, it } from "vitest"
import { resolveDefaultCategory } from "@/lib/insight/resolveDefaultCategory"
import type { CategoryGroupWithCategories } from "@/lib/hooks/useCategories"

function group(overrides: Partial<CategoryGroupWithCategories>): CategoryGroupWithCategories {
  return {
    id: "group-1",
    name: "Some group",
    icon: null,
    color: null,
    cost_type_id: null,
    cost_type_code: null,
    is_system: true,
    categories: [],
    ...overrides,
  }
}

function category(id: string, name: string) {
  return { id, name, icon: null, default_behavior_type: "manual", is_system: true }
}

describe("resolveDefaultCategory", () => {
  it("resolves the leaf category under the exact 'Ăn uống ngoài' group", () => {
    const groups = [
      group({ name: "Giải trí", cost_type_code: "wasteful", categories: [category("c1", "Giải trí")] }),
      group({ name: "Ăn uống ngoài", cost_type_code: "wasteful", categories: [category("c2", "Ăn uống ngoài")] }),
    ]

    expect(resolveDefaultCategory(groups)?.id).toBe("c2")
  })

  it("falls back to the first category in the wasteful group when the exact name is missing", () => {
    const groups = [
      group({ name: "Variable stuff", cost_type_code: "variable", categories: [category("c1", "x")] }),
      group({ name: "Renamed group", cost_type_code: "wasteful", categories: [category("c2", "y"), category("c3", "z")] }),
    ]

    expect(resolveDefaultCategory(groups)?.id).toBe("c2")
  })

  it("returns null without throwing when no group matches", () => {
    const groups = [group({ name: "Fixed", cost_type_code: "fixed", categories: [category("c1", "x")] })]

    expect(resolveDefaultCategory(groups)).toBeNull()
  })

  it("returns null when the matched group has no categories", () => {
    const groups = [group({ name: "Ăn uống ngoài", cost_type_code: "wasteful", categories: [] })]

    expect(resolveDefaultCategory(groups)).toBeNull()
  })
})
