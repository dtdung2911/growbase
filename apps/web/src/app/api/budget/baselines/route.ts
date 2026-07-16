import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  batchUpdateBaselinesSchema,
  createCustomBaselineSchema,
} from "@growbase/shared/schemas/budget-baseline"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase.rpc("get_budget_baselines", {
    p_household_id: auth.householdId,
  })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function PUT(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = batchUpdateBaselinesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    try {
      const updates = parsed.data.baselines.map((b) =>
        supabaseAdmin
          .from("budget_baselines")
          .update({ budget_pct: b.budget_pct })
          .eq("id", b.id)
          .eq("household_id", auth.householdId)
          .eq("is_auto_calculated", false)
      )

      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)

      if (failed?.error) {
        return NextResponse.json(
          { data: null, error: failed.error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data: { updated: parsed.data.baselines.length }, error: null })
    } catch {
      return NextResponse.json(
        { data: null, error: "Lỗi cập nhật phân bổ ngân sách" },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = createCustomBaselineSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const { data, error } = await auth.supabase
      .from("budget_baselines")
      .insert({
        household_id: auth.householdId,
        name: parsed.data.name,
        budget_pct: parsed.data.budget_pct,
        linked_category_group_ids: parsed.data.linked_category_group_ids ?? [],
        description: parsed.data.description ?? null,
        is_system: false,
        is_auto_calculated: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  })
}
