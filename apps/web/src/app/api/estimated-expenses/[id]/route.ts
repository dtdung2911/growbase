import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateEstimatedExpenseSchema } from "@growbase/shared/schemas/estimated-expense"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateEstimatedExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("estimated_expenses")
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

  const { error } = await auth.supabase
    .from("estimated_expenses")
    .delete()
    .eq("id", id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}
