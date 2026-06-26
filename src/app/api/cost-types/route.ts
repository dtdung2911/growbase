import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { createCostTypeSchema } from "@/lib/validations/cost-type"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("cost_types")
    .select("id, household_id, code, display_name, display_name_vi, sort_order, is_system")
    .eq("household_id", auth.householdId)
    .order("sort_order", { ascending: true })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = createCostTypeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from("cost_types")
    .insert({
      ...parsed.data,
      household_id: auth.householdId,
      is_system: false,
    })
    .select("id, household_id, code, display_name, display_name_vi, sort_order, is_system")
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
