import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/supabase/auth-check"

type Params = { params: { id: string } }

export async function GET(_request: Request, { params }: Params) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  if (!z.string().uuid().safeParse(params.id).success) {
    return NextResponse.json(
      { data: null, error: "Fund ID không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("fund_transactions")
    .select(
      "id, fund_id, transaction_type, amount, direction, balance_after, description, transaction_date, is_automatic, created_at"
    )
    .eq("fund_id", params.id)
    .eq("household_id", auth.householdId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}
