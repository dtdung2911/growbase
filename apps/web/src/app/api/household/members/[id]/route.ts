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

    // Guard: check caller is owner
    const { data: caller, error: callerErr } = await auth.supabase
      .from("household_members")
      .select("role")
      .eq("id", auth.memberId)
      .single()

    if (callerErr || !caller || caller.role !== "owner") {
      return NextResponse.json(
        { data: null, error: "Chỉ chủ hộ mới có thể xóa thành viên" },
        { status: 403 }
      )
    }

    // Guard: check target is not owner
    const { data: target, error: targetErr } = await auth.supabase
      .from("household_members")
      .select("role")
      .eq("id", id)
      .eq("household_id", auth.householdId)
      .single()

    if (targetErr || !target) {
      return NextResponse.json(
        { data: null, error: "Thành viên không tồn tại" },
        { status: 404 }
      )
    }

    if (target.role === "owner") {
      return NextResponse.json(
        { data: null, error: "Không thể xóa chủ hộ" },
        { status: 403 }
      )
    }

    // Soft delete
    const { error } = await auth.supabase
      .from("household_members")
      .update({ is_active: false })
      .eq("id", id)
      .eq("household_id", auth.householdId)

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { id }, error: null })
  })
}
