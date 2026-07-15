import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@growbase/shared/types/database"
import { SUPABASE_STORAGE_KEY } from "./constants"

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  // ssr@0.5.2 import GenericSchema từ path đã đổi trong supabase-js@2.108 →
  // generic Schema resolve về `any`. Cast tường minh để giữ typed queries.
  const supabase = createServerClient<Database>(
    // Self-host: gọi Supabase nội bộ trong instance (fallback public khi Cloud/dev).
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { storageKey: SUPABASE_STORAGE_KEY },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  ) as unknown as SupabaseClient<Database>

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user, response }
}
