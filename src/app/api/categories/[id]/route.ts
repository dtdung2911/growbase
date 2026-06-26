import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateCategorySchema } from "@/lib/validations/category"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  // Guard: is_system=true cannot be edited
  const { data: existing, error: fetchErr } = await auth.supabase
    .from("categories")
    .select("is_system")
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json(
      { data: null, error: "Danh mục không tồn tại" },
      { status: 404 }
    )
  }

  if (existing.is_system) {
    return NextResponse.json(
      { data: null, error: "Không thể sửa danh mục hệ thống" },
      { status: 403 }
    )
  }

  const { data, error } = await auth.supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .select()
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

  // Guard: is_system=true cannot be deleted
  const { data: existing, error: fetchErr } = await auth.supabase
    .from("categories")
    .select("is_system")
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json(
      { data: null, error: "Danh mục không tồn tại" },
      { status: 404 }
    )
  }

  if (existing.is_system) {
    return NextResponse.json(
      { data: null, error: "Không thể xóa danh mục hệ thống" },
      { status: 403 }
    )
  }

  // Check if category has transactions
  const { count } = await auth.supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if (count && count > 0) {
    return NextResponse.json(
      { data: null, error: "Danh mục có giao dịch, hãy vô hiệu hóa thay vì xóa" },
      { status: 409 }
    )
  }

  const { error } = await auth.supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}
