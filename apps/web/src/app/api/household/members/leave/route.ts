import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    // Guard: check caller is NOT owner
    const { data: caller, error: callerErr } = await auth.supabase
      .from("household_members")
      .select("role")
      .eq("id", auth.memberId)
      .single()

    if (callerErr || !caller) {
      return NextResponse.json(
        { data: null, error: "Thành viên không tồn tại" },
        { status: 404 }
      )
    }

    if (caller.role === "owner") {
      return NextResponse.json(
        { data: null, error: "Chủ hộ không thể rời hộ gia đình" },
        { status: 403 }
      )
    }

    // Soft delete self
    const { error } = await auth.supabase
      .from("household_members")
      .update({ is_active: false })
      .eq("id", auth.memberId)

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { left: true }, error: null })
  })
}
