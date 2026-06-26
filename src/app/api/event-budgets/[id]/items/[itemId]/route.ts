import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateEventBudgetItemSchema } from "@/lib/validations/event-budget"

async function assertOwnsEvent(
  supabase: NonNullable<Awaited<ReturnType<typeof withAuth>>["supabase"]>,
  eventBudgetId: string,
  householdId: string
) {
  const { data, error } = await supabase
    .from("event_budgets")
    .select("id")
    .eq("id", eventBudgetId)
    .eq("household_id", householdId)
    .maybeSingle()
  return { ok: Boolean(data), error }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id, itemId } = await params

  const body = await request.json().catch(() => null)
  const parsed = updateEventBudgetItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const owns = await assertOwnsEvent(auth.supabase, id, auth.householdId)
  if (owns.error) {
    return NextResponse.json({ data: null, error: owns.error.message }, { status: 500 })
  }
  if (!owns.ok) {
    return NextResponse.json({ data: null, error: "Không tìm thấy sự kiện" }, { status: 404 })
  }

  const { data, error } = await auth.supabase
    .from("event_budget_items")
    .update(parsed.data)
    .eq("id", itemId)
    .eq("event_budget_id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id, itemId } = await params

  const owns = await assertOwnsEvent(auth.supabase, id, auth.householdId)
  if (owns.error) {
    return NextResponse.json({ data: null, error: owns.error.message }, { status: 500 })
  }
  if (!owns.ok) {
    return NextResponse.json({ data: null, error: "Không tìm thấy sự kiện" }, { status: 404 })
  }

  const { error } = await auth.supabase
    .from("event_budget_items")
    .delete()
    .eq("id", itemId)
    .eq("event_budget_id", id)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: itemId }, error: null })
}
