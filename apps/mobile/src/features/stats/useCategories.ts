import { keys } from "@growbase/shared/queryKeys"
import type { CategoryGroupWithCategories } from "@growbase/shared/types/category"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

export function useCategories() {
  const user = useAppStore((s) => s.user)
  const householdId = useAppStore((s) => s.householdId)
  const isLocked = useAppStore((s) => s.isLocked)

  return useQuery({
    queryKey: keys.categories(householdId ?? ""),
    queryFn: () => apiFetch<CategoryGroupWithCategories[]>("/api/categories"),
    enabled: !!user && !!householdId && !isLocked,
  })
}
