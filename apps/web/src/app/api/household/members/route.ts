import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const [membersResult, invitationsResult] = await Promise.all([
    auth.supabase
      .from("household_members")
      .select("id, household_id, user_id, display_name, role, joined_at, is_active")
      .eq("household_id", auth.householdId)
      .eq("is_active", true)
      .order("joined_at", { ascending: true }),
    auth.supabase
      .from("household_invitations")
      .select("id, household_id, email, display_name, role, token, status, expires_at, created_at")
      .eq("household_id", auth.householdId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ])

  if (membersResult.error) {
    return NextResponse.json(
      { data: null, error: membersResult.error.message },
      { status: 500 }
    )
  }

  if (invitationsResult.error) {
    return NextResponse.json(
      { data: null, error: invitationsResult.error.message },
      { status: 500 }
    )
  }

  const members = membersResult.data ?? []
  const isOwner = members.some((m) => m.user_id === auth.user.id && m.role === "owner")
  // token is a bearer credential (accept_invitation RPC doesn't verify invitee email) — owner-only
  const invitations = (invitationsResult.data ?? []).map((inv) => {
    if (isOwner) return inv
    const { token: _token, ...rest } = inv
    return rest
  })

  return NextResponse.json({
    data: { members, invitations },
    error: null,
  })
}
