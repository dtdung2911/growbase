import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import { SUPABASE_STORAGE_KEY } from "./constants"

// TODO: Remove CookieToSet alias when database.ts is generated from Supabase
// (self-defined here vì database.ts hiện là placeholder).
type CookieToSet = { name: string; value: string; options: CookieOptions }

// ssr@0.5.2 import GenericSchema từ path đã đổi trong supabase-js@2.108 →
// generic Schema resolve về `any`. Annotate tường minh để giữ typed queries.
export const createClient = (): SupabaseClient<Database> => {
  const cookieStore = cookies()

  const client = createServerClient<Database>(
    // Server chạy trên cùng máy Supabase (self-host) → gọi nội bộ, không ra internet.
    // Cloud/dev không set INTERNAL → fallback public URL.
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { storageKey: SUPABASE_STORAGE_KEY },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — middleware refreshes the session instead
          }
        },
      },
    }
  )

  return client as unknown as SupabaseClient<Database>
}
