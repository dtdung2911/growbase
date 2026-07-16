import type { Database } from "@growbase/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { largeSecureStore } from "@/lib/supabase/largeSecureStore";

// Literal property access is required: Expo/babel inlines EXPO_PUBLIC_* at build time.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. Add them to apps/mobile/.env (copy .env.example).",
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: largeSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
