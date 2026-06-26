import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateTransactionSchema } from "@/lib/validations/transaction"

type Params = { params: { id: string } }

export async function PUT(request: Request, { params }: Params) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = updateTransactionSchema.safeParse({ ...body, id: params.id })
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const input = parsed.data

  // Verify ownership + fetch transaction_type for system guard
  const { data: existing } = await auth.supabase
    .from("transactions")
    .select("id, transaction_type")
    .eq("id", input.id)
    .eq("household_id", auth.householdId)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { data: null, error: "Giao dịch không tồn tại" },
      { status: 404 }
    )
  }

  // R3: system-generated transactions are immutable
  const SYSTEM_TYPES = ["internal_transfer", "fund_contribution", "fund_withdrawal"]
  if (SYSTEM_TYPES.includes(existing.transaction_type)) {
    return NextResponse.json(
      { data: null, error: "Giao dịch hệ thống không thể sửa" },
      { status: 403 }
    )
  }

  const { data, error } = await auth.supabase
    .from("transactions")
    .update({
      amount: input.amount,
      direction: input.direction,
      transaction_type: input.transaction_type,
      category_id: input.category_id,
      account_id: input.account_id,
      description: input.description ?? null,
      transaction_date: input.transaction_date,
      is_unusual_income: input.is_unusual_income,
      debt_entry_id: input.debt_entry_id ?? null,
    })
    .eq("id", input.id)
    .eq("household_id", auth.householdId)
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: data.id }, error: null })
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data: existing } = await auth.supabase
    .from("transactions")
    .select("id, transaction_type")
    .eq("id", params.id)
    .eq("household_id", auth.householdId)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { data: null, error: "Giao dịch không tồn tại" },
      { status: 404 }
    )
  }

  // R3: system-generated transactions are immutable
  const SYSTEM_TYPES = ["internal_transfer", "fund_contribution", "fund_withdrawal"]
  if (SYSTEM_TYPES.includes(existing.transaction_type)) {
    return NextResponse.json(
      { data: null, error: "Giao dịch hệ thống không thể xoá" },
      { status: 403 }
    )
  }

  const { error } = await auth.supabase
    .from("transactions")
    .delete()
    .eq("id", params.id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: params.id }, error: null })
}
