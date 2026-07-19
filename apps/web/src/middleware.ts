import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { appOrigin } from "@/lib/utils/appOrigin"

// Dựng redirect từ origin app authoritative (NEXT_PUBLIC_SITE_URL) thay host request.url = loopback sau proxy; giữ nguyên query.
function redirectTo(request: NextRequest, pathname: string) {
  const url = new URL(pathname, appOrigin(request.nextUrl.origin))
  url.search = request.nextUrl.search
  return NextResponse.redirect(url)
}

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
    return redirectTo(request, "/login")
  }

  // Load all active household memberships to determine setup state
  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, households!inner(onboarding_completed)")
    .eq("user_id", user.id)
    .eq("is_active", true)

  type MRow = { household_id: string; households: { onboarding_completed: boolean } }
  const rows = (memberships ?? []) as unknown as MRow[]

  // needsSetup: no households at all, or any household not yet completed
  const needsSetup =
    rows.length === 0 || rows.some((m) => !m.households.onboarding_completed)

  if (needsSetup) {
    if (pathname !== "/setup") {
      return redirectTo(request, "/setup")
    }
    return response
  }

  // All households complete — fully onboarded. Redirect away from entry pages.
  if (pathname === "/" || pathname === "/login" || pathname === "/setup") {
    return redirectTo(request, "/dashboard")
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
