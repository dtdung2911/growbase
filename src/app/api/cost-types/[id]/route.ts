import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateCostTypeSchema } from "@/lib/validations/cost-type"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateCostTypeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data: existing, error: fetchErr } = await auth.supabase
    .from("cost_types")
    .select("is_system, household_id")
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json(
      { data: null, error: "Loại chi phí không tồn tại" },
      { status: 404 }
    )
  }

  if (existing.is_system) {
    return NextResponse.json(
      { data: null, error: "Không thể sửa loại chi phí hệ thống" },
      { status: 403 }
    )
  }

  const { data, error } = await auth.supabase
    .from("cost_types")
    .update(parsed.data)
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .select("id, household_id, code, display_name, display_name_vi, sort_order, is_system")
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
    .from("cost_types")
    .select("is_system")
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json(
      { data: null, error: "Loại chi phí không tồn tại" },
      { status: 404 }
    )
  }

  if (existing.is_system) {
    return NextResponse.json(
      { data: null, error: "Không thể xóa loại chi phí hệ thống" },
      { status: 403 }
    )
  }

  const { count } = await auth.supabase
    .from("category_groups")
    .select("id", { count: "exact", head: true })
    .eq("cost_type_id", id)

  if (count && count > 0) {
    return NextResponse.json(
      { data: null, error: "Loại chi phí còn nhóm danh mục, hãy xóa nhóm trước" },
      { status: 409 }
    )
  }

  const { error } = await auth.supabase
    .from("cost_types")
    .delete()
    .eq("id", id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}
