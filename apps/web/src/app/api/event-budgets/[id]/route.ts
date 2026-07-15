import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateEventBudgetSchema } from "@growbase/shared/schemas/event-budget"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const { data, error } = await auth.supabase
    .from("event_budgets")
    .select(
      "id, household_id, name, total_budget, total_actual, event_date, status, notes, created_at, items:event_budget_items(id, event_budget_id, name, planned_amount, actual_amount, sort_order, notes, created_at)"
    )
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .order("sort_order", { ascending: true, referencedTable: "event_budget_items" })
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateEventBudgetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("event_budgets")
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
    .from("event_budgets")
    .delete()
    .eq("id", id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}
