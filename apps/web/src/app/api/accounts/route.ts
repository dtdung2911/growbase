import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("accounts")
    .select(
      "id, household_id, name, bank_name, account_type, owner_name, is_credit_card, color, sort_order, is_active"
    )
    .eq("household_id", auth.householdId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}
