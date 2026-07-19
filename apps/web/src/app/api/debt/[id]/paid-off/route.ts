import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {
    const { id } = await params

    // Guard: check current status
    const { data: existing, error: fetchErr } = await auth.supabase
      .from("debt_entries")
      .select("status")
      .eq("id", id)
      .eq("household_id", auth.householdId)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json(
        { data: null, error: "Khoản nợ không tồn tại" },
        { status: 404 }
      )
    }

    if (existing.status === "paid_off") {
      return NextResponse.json(
        { data: null, error: "Khoản nợ đã được thanh toán" },
        { status: 409 }
      )
    }

    const today = new Date().toISOString().split("T")[0]

    const { data: debt, error: updateErr } = await auth.supabase
      .from("debt_entries")
      .update({
        status: "paid_off",
        actual_end_date: today,
        remaining_amount: 0,
      })
      .eq("id", id)
      .eq("household_id", auth.householdId)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ data: null, error: updateErr.message }, { status: 500 })
    }

    // Count remaining active debts
    const { count } = await auth.supabase
      .from("debt_entries")
      .select("id", { count: "exact", head: true })
      .eq("household_id", auth.householdId)
      .eq("status", "active")

    return NextResponse.json({
      data: { debt, is_last_debt: count === 0 },
      error: null,
    })
  })
}
