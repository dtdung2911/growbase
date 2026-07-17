import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { createCategorySchema } from "@growbase/shared/schemas/category"
import type { CategoryGroupWithCategories } from "@growbase/shared/types/category"

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

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("category_groups")
    .select(
      "id, name, icon, color, cost_type_id, is_system, sort_order, cost_types(code), categories(id, name, icon, default_behavior_type, is_system, is_active, sort_order)"
    )
    .or(`household_id.eq.${auth.householdId},household_id.is.null`)
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  // Nested-select types không resolve trên placeholder database.ts → narrow thủ công.
  const allRows = (data ?? []) as unknown as GroupRow[]
  const hasHouseholdGroups = allRows.some((g) => !g.is_system)
  const rows = hasHouseholdGroups ? allRows.filter((g) => !g.is_system) : allRows

  const groups: CategoryGroupWithCategories[] = rows.map((g) => ({
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

  return NextResponse.json({ data: groups, error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from("categories")
      .insert({
        ...parsed.data,
        household_id: auth.householdId,
        is_system: false,
        created_by_member_id: auth.memberId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  })
}
