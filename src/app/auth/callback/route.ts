import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { data: household } = await supabase
    .from("households")
    .select("onboarding_completed, household_members!inner(user_id, role)")
    .eq("household_members.user_id", user.id)
    .eq("household_members.role", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const dest =
    household?.onboarding_completed === true ? "/dashboard" : "/setup"

  return NextResponse.redirect(`${origin}${dest}`)
}
