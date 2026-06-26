import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateCategoryGroupSchema } from "@/lib/validations/category-group"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateCategoryGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data: existing, error: fetchErr } = await auth.supabase
    .from("category_groups")
    .select("is_system")
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json(
      { data: null, error: "Nhóm danh mục không tồn tại" },
      { status: 404 }
    )
  }

  if (existing.is_system) {
    return NextResponse.json(
      { data: null, error: "Không thể sửa nhóm hệ thống" },
      { status: 403 }
    )
  }

  const { data, error } = await auth.supabase
    .from("category_groups")
    .update(parsed.data)
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .select("id, name, icon, color, cost_type_id, sort_order, is_system")
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const { data: existing, error: fetchErr } = await auth.supabase
    .from("category_groups")
    .select("is_system")
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json(
      { data: null, error: "Nhóm danh mục không tồn tại" },
      { status: 404 }
    )
  }

  if (existing.is_system) {
    return NextResponse.json(
      { data: null, error: "Không thể xóa nhóm hệ thống" },
      { status: 403 }
    )
  }

  const { count } = await auth.supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("group_id", id)

  if (count && count > 0) {
    return NextResponse.json(
      { data: null, error: "Nhóm còn danh mục, hãy xóa danh mục trước" },
      { status: 409 }
    )
  }

  const { error } = await auth.supabase
    .from("category_groups")
    .delete()
    .eq("id", id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}
