import { router } from "expo-router"
import { purgeQueryCache } from "@/lib/query/queryClient"
import { supabase } from "@/lib/supabase/client"
import { useAppStore } from "@/store/appStore"

export async function signOutAndPurge(): Promise<void> {
  // No cleanup step (signOut, cache purge) may trap the user: clear everything
  // and route out even if any of them throws.
  try {
    await supabase.auth.signOut()
  } catch {
    // ignore — cleared below regardless
  }
  try {
    await purgeQueryCache()
  } catch {
    // ignore — cleared below regardless
  } finally {
    useAppStore.getState().reset()
    useAppStore.persist.clearStorage()
    router.replace("/login")
  }
}
