import { NextResponse } from "next/server"
import { withAuth, verifyHouseholdMember } from "@/lib/supabase/auth-check"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { inviteSchema } from "@growbase/shared/schemas/household"
import { appOrigin } from "@/lib/utils/appOrigin"

export async function POST(request: Request) {
  // AD-1: withAuth() mandatory first call
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { user, supabase } = auth

  const body = await request.json().catch(() => null)
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }
  const { householdId, email, display_name, role } = parsed.data

  // AD-6: Verify user is active member of the specific householdId
  const guard = await verifyHouseholdMember(supabase, user.id, householdId)
  if (!guard.ok) return guard.error

  // Additional role check: only owner may invite
  const { data: member } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("role", "owner")
    .maybeSingle()

  if (!member) {
    return NextResponse.json(
      { data: null, error: "Not household owner" },
      { status: 403 }
    )
  }

  // AD-2: invite token generation là system operation
  const { data: invitation, error } = await supabaseAdmin
    .from("household_invitations")
    .insert({
      household_id: householdId,
      email: email.toLowerCase().trim(),
      display_name,
      role,
    })
    .select("token")
    .single()

  if (error || !invitation) {
    return NextResponse.json(
      { data: null, error: error?.message ?? "Không tạo được lời mời" },
      { status: 500 }
    )
  }

  const origin = appOrigin(new URL(request.url).origin)
  return NextResponse.json({
    data: {
      token: invitation.token,
      inviteLink: `${origin}/invite/${invitation.token}`,
    },
    error: null,
  })
}
