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
      .select("id, household_id, email, display_name, role, status, expires_at, created_at")
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

  return NextResponse.json({
    data: {
      members: membersResult.data ?? [],
      invitations: invitationsResult.data ?? [],
    },
    error: null,
  })
}
