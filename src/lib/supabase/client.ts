import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { SUPABASE_STORAGE_KEY } from "./constants"

// ssr@0.5.2 import GenericSchema từ path đã đổi trong supabase-js@2.108 →
// generic Schema resolve về `any`. Cast tường minh để giữ typed queries.
export const createClient = (): SupabaseClient<Database> =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { storageKey: SUPABASE_STORAGE_KEY } }
  ) as unknown as SupabaseClient<Database>
