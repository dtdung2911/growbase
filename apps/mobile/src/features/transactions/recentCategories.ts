import type { CategoryGroupWithCategories } from "@growbase/shared/types/category"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { appStorage } from "@/lib/storage/mmkv"

const CAP = 6

type FlatCategory = CategoryGroupWithCategories["categories"][number]

export function pushRecent(ids: string[], id: string): string[] {
  return [id, ...ids.filter((x) => x !== id)].slice(0, CAP)
}

export function filterByDirection(
  groups: CategoryGroupWithCategories[],
  direction: "in" | "out"
): CategoryGroupWithCategories[] {
  const wantIncome = direction === "in"
  return groups.filter((g) => (g.cost_type_code === "income") === wantIncome)
}

export function recentCategoriesFor(
  groups: CategoryGroupWithCategories[],
  recentIds: string[]
): FlatCategory[] {
  const byId = new Map<string, FlatCategory>()
  for (const g of groups) for (const c of g.categories) byId.set(c.id, c)
  return recentIds.map((id) => byId.get(id)).filter((c): c is FlatCategory => !!c)
}

type RecentCategoriesState = {
  recentIds: string[]
  push: (id: string) => void
}

export const useRecentCategories = create<RecentCategoriesState>()(
  persist(
    (set) => ({
      recentIds: [],
      push: (id) => set((s) => ({ recentIds: pushRecent(s.recentIds, id) })),
    }),
    {
      name: "growbase-recent-categories",
      storage: createJSONStorage(() => appStorage),
    }
  )
)
