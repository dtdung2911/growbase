import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { budgetOverrideSchema, budgetOverrideDeleteSchema } from "@/lib/validations/budget"

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = budgetOverrideSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const input = parsed.data

  const { data, error } = await auth.supabase
    .from("budget_overrides")
    .upsert(
      {
        household_id: auth.householdId,
        budget_baseline_id: input.budget_baseline_id,
        month: input.month,
        override_pct: input.override_pct,
      },
      { onConflict: "budget_baseline_id,month" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = budgetOverrideDeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { error } = await auth.supabase
    .from("budget_overrides")
    .delete()
    .match({
      household_id: auth.householdId,
      budget_baseline_id: parsed.data.budget_baseline_id,
      month: parsed.data.month,
    })

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: null, error: null })
}
