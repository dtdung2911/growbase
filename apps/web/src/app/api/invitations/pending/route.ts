import { NextResponse } from "next/server"
import { withAuthUser } from "@/lib/supabase/auth-check"
import { supabaseAdmin } from "@/lib/supabase/admin"

// Lời mời chưa nhận cho user hiện tại (chưa thuộc household nào) — dùng ở màn /setup để
// hiện lựa chọn "Tham gia" thay vì ép onboarding. RLS chặn client đọc household_invitations
// của người khác → phải dùng supabaseAdmin (service role) và lọc theo email đã xác thực.
export async function GET() {
  const auth = await withAuthUser()
  if (auth.error) return auth.error

  const email = auth.user.email
  if (!email) return NextResponse.json({ data: [], error: null })

  const { data, error } = await supabaseAdmin
    .from("household_invitations")
    .select("token, role, household:households(name)")
    .ilike("email", email)
    .eq("status", "pending")

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  const invites = (data ?? []).map((row) => {
    const household = row.household as unknown as { name: string } | null
    return {
      token: row.token as string,
      householdName: household?.name ?? "",
      role: row.role as string,
    }
  })

  return NextResponse.json({ data: invites, error: null })
}
