import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_PATTERNS = [
  /^\/login$/,
  /^\/auth\/callback/,
  /^\/invite\//,
  /^\/api\//,
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /.*\.(png|jpg|jpeg|svg|ico|webp)$/,
]

function isPublic(pathname: string) {
  return PUBLIC_PATTERNS.some((re) => re.test(pathname))
}

export async function middleware(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return response

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  const { data: household } = await supabase
    .from("households")
    .select("onboarding_completed, household_members!inner(user_id, role)")
    .eq("household_members.user_id", user.id)
    .eq("household_members.role", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const onboarded = household?.onboarding_completed === true

  if (!onboarded) {
    if (pathname !== "/setup") {
      const url = request.nextUrl.clone()
      url.pathname = "/setup"
      return NextResponse.redirect(url)
    }
    return response
  }

  if (pathname === "/" || pathname === "/login" || pathname === "/setup") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
