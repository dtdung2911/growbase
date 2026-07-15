import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createCategorySchema } from "@growbase/shared/schemas/category"

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

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
}
