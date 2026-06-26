import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/supabase/auth-check"
import { scheduledPaymentCreateSchema } from "@/lib/validations/scheduled-payment"

type RouteParams = { params: { id: string } }

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const updateSchema = scheduledPaymentCreateSchema.partial().extend({
    status: z.enum(["active", "cancelled", "expired"]).optional(),
  })
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const input = parsed.data
  const updatePayload: Partial<{
    name: string
    amount: number
    period: "monthly" | "quarterly" | "yearly"
    payment_method: string | null
    next_due_date: string
    notes: string | null
    status: "active" | "cancelled" | "expired"
  }> = {}
  if (input.name !== undefined) updatePayload.name = input.name
  if (input.amount !== undefined) updatePayload.amount = input.amount
  if (input.period !== undefined) updatePayload.period = input.period
  if (input.payment_method !== undefined) updatePayload.payment_method = input.payment_method ?? null
  if (input.next_due_date !== undefined) updatePayload.next_due_date = input.next_due_date
  if (input.notes !== undefined) updatePayload.notes = input.notes ?? null
  if (input.status !== undefined) updatePayload.status = input.status

  const { data, error } = await auth.supabase
    .from("scheduled_payments")
    .update(updatePayload)
    .eq("id", params.id)
    .eq("household_id", auth.householdId)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { data: null, error: "Khoản định kỳ không tồn tại" },
      { status: 404 }
    )
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { error } = await auth.supabase
    .from("scheduled_payments")
    .delete()
    .eq("id", params.id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { id: params.id }, error: null })
}
