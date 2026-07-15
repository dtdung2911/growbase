import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createEventBudgetItemSchema } from "@growbase/shared/schemas/event-budget"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = createEventBudgetItemSchema.safeParse({ ...body, event_budget_id: id })
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data: parent, error: parentError } = await auth.supabase
    .from("event_budgets")
    .select("id")
    .eq("id", id)
    .eq("household_id", auth.householdId)
    .maybeSingle()

  if (parentError) {
    return NextResponse.json({ data: null, error: parentError.message }, { status: 500 })
  }
  if (!parent) {
    return NextResponse.json({ data: null, error: "Không tìm thấy sự kiện" }, { status: 404 })
  }

  const { data, error } = await auth.supabase
    .from("event_budget_items")
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
