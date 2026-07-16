import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {
    const { id } = await params

    // Guard: only custom, non-auto baselines can be deleted
    const { data: existing, error: fetchErr } = await auth.supabase
      .from("budget_baselines")
      .select("is_system, is_auto_calculated")
      .eq("id", id)
      .eq("household_id", auth.householdId)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json(
        { data: null, error: "Mục ngân sách không tồn tại" },
        { status: 404 }
      )
    }

    if (existing.is_system || existing.is_auto_calculated) {
      return NextResponse.json(
        { data: null, error: "Không thể xóa mục ngân sách hệ thống" },
        { status: 403 }
      )
    }

    const { error } = await auth.supabase
      .from("budget_baselines")
      .delete()
      .eq("id", id)
      .eq("household_id", auth.householdId)

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { id }, error: null })
  })
}
