import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { scheduledPaymentCreateSchema } from "@growbase/shared/schemas/scheduled-payment"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("scheduled_payments")
    .select("*")
    .eq("household_id", auth.householdId)
    .order("next_due_date")

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = scheduledPaymentCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const input = parsed.data

    const { data, error } = await auth.supabase
      .from("scheduled_payments")
      .insert({
        household_id: auth.householdId,
        name: input.name,
        amount: input.amount,
        period: input.period,
        payment_method: input.payment_method ?? null,
        next_due_date: input.next_due_date,
        notes: input.notes ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, error: null }, { status: 201 })
  })
}
