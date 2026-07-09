"use client"

import { useQuery } from "@tanstack/react-query"
import { keys } from "@/lib/queries/queryKeys"
import { createClient } from "@/lib/supabase/client"

export type CategoryGroupWithCategories = {
  id: string
  name: string
  icon: string | null
  color: string | null
  cost_type_id: string | null
  cost_type_code: string | null
  is_system: boolean
  categories: {
    id: string
    name: string
    icon: string | null
    default_behavior_type: string
    is_system: boolean
  }[]
}

type GroupRow = {
  id: string
  name: string
  icon: string | null
  color: string | null
  cost_type_id: string | null
  is_system: boolean
  sort_order: number
  cost_types: { code: string } | null
  categories: {
    id: string
    name: string
    icon: string | null
    default_behavior_type: string
    is_system: boolean
    is_active: boolean
    sort_order: number
  }[]
}

export function useCategories(householdId: string) {
  return useQuery({
    queryKey: keys.categories(householdId),
    staleTime: 24 * 60 * 60_000,
    queryFn: async (): Promise<CategoryGroupWithCategories[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("category_groups")
        .select(
          "id, name, icon, color, cost_type_id, is_system, sort_order, cost_types(code), categories(id, name, icon, default_behavior_type, is_system, is_active, sort_order)"
        )
        .or(`household_id.eq.${householdId},household_id.is.null`)
        .order("household_id", { ascending: false, nullsFirst: false })
        .order("sort_order", { ascending: true })

      if (error) throw new Error(error.message)

      // Nested-select types không resolve được trên placeholder database.ts
      // (thiếu FK metadata) → narrow thủ công về shape đã biết.
      const allRows = (data ?? []) as unknown as GroupRow[]
      const hasHouseholdGroups = allRows.some((g) => !g.is_system)
      const rows = hasHouseholdGroups
        ? allRows.filter((g) => !g.is_system)
        : allRows
      return rows.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        color: g.color,
        cost_type_id: g.cost_type_id,
        cost_type_code: g.cost_types?.code ?? null,
        is_system: g.is_system,
        categories: (g.categories ?? [])
          .filter((c) => c.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            default_behavior_type: c.default_behavior_type,
            is_system: c.is_system,
          })),
      }))
    },
    enabled: Boolean(householdId),
  })
}
