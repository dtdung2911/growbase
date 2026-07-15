import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { appOrigin } from "@/lib/utils/appOrigin"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const base = appOrigin(origin)
  const code = searchParams.get("code")

  if (!code) {
    console.error("[auth/callback] missing code", { url: request.url })
    return NextResponse.redirect(`${base}/login`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error("[auth/callback] exchange failed", {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    })
    return NextResponse.redirect(`${base}/login`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("[auth/callback] no user after exchange")
    return NextResponse.redirect(`${base}/login`)
  }

  const { data: household, error: hhError } = await supabase
    .from("households")
    .select("onboarding_completed, household_members!inner(user_id, role)")
    .eq("household_members.user_id", user.id)
    .eq("household_members.role", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (hhError) {
    console.error("[auth/callback] household query error", hhError.message)
  }

  const dest =
    household?.onboarding_completed === true ? "/dashboard" : "/setup"

  console.info("[auth/callback] success", { userId: user.id, dest })
  return NextResponse.redirect(`${base}${dest}`)
}
