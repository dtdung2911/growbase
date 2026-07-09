import type { CategoryGroupWithCategories } from "@/lib/hooks/useCategories"

export function resolveDefaultCategory(groups: CategoryGroupWithCategories[]) {
  const target =
    groups.find((g) => g.name === "Ăn uống ngoài") ??
    groups.find((g) => g.cost_type_code === "wasteful")
  return target?.categories[0] ?? null
}
