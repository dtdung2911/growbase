import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { createIncomeSourceSchema } from "@growbase/shared/schemas/income-source"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("income_sources")
    .select("*")
    .eq("household_id", auth.householdId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  const all = data ?? []
  const current = all.filter((s) => s.is_current)
  const history = all.filter((s) => !s.is_current)

  return NextResponse.json({ data: { current, history }, error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = createIncomeSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await auth.supabase
      .from("income_sources")
      .insert({
        ...parsed.data,
        household_id: auth.householdId,
        is_current: true,
        effective_from: today,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  })
}
