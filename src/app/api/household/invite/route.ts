import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { inviteSchema } from "@/lib/validations/household"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }
  const { householdId, email, display_name, role } = parsed.data

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle()

  if (!member) {
    return NextResponse.json(
      { data: null, error: "Not household owner" },
      { status: 403 }
    )
  }

  const { data: invitation, error } = await supabase
    .from("household_invitations")
    .insert({
      household_id: householdId,
      email,
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

  const origin = new URL(request.url).origin
  return NextResponse.json({
    data: {
      token: invitation.token,
      inviteLink: `${origin}/invite/${invitation.token}`,
    },
    error: null,
  })
}
