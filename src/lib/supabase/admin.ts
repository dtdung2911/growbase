import { createClient } from "@supabase/supabase-js"

export const supabaseAdmin = createClient(
  // Self-host: gọi Supabase nội bộ trong instance (fallback public khi Cloud/dev).
  process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
