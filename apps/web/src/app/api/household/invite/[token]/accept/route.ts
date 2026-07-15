import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: { token: string } }

export async function POST(_request: Request, { params }: Params) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })
  }

  const { token } = params

  // Pre-check: nếu user đã là member của household trong lời mời → alreadyMember.
  const { data: inv } = await supabase
    .rpc("get_invitation_by_token", { p_token: token })
    .maybeSingle()

  if (inv) {
    const { data: existingMember } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", inv.household_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({
        data: {
          household_id: inv.household_id,
          member_id: existingMember.id,
          alreadyMember: true,
        },
        error: null,
      })
    }
  }

  const { data: memberId, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
    p_user_id: user.id,
  })

  if (error) {
    const msg = error.message
    if (msg.includes("expired")) {
      return NextResponse.json({ data: null, error: "Invitation expired" }, { status: 410 })
    }
    if (msg.includes("not found")) {
      return NextResponse.json({ data: null, error: "Invitation not found" }, { status: 404 })
    }
    if (msg.includes("not pending")) {
      return NextResponse.json(
        { data: null, error: "Lời mời đã được sử dụng" },
        { status: 409 }
      )
    }
    return NextResponse.json({ data: null, error: msg }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      household_id: inv?.household_id ?? null,
      member_id: memberId,
      alreadyMember: false,
    },
    error: null,
  })
}
