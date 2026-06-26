import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createEstimatedExpenseSchema } from "@/lib/validations/estimated-expense"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("estimated_expenses")
    .select("*")
    .eq("household_id", auth.householdId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = createEstimatedExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("estimated_expenses")
    .insert({
      ...parsed.data,
      household_id: auth.householdId,
      status: "planned",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
