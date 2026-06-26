import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createCategoryGroupSchema } from "@/lib/validations/category-group"

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = createCategoryGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("category_groups")
    .insert({
      ...parsed.data,
      household_id: auth.householdId,
      is_system: false,
    })
    .select("id, name, icon, color, cost_type_id, sort_order, is_system")
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
