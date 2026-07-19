import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { setAccessTokenProvider } from "@/api/client";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";

type StoreActions = { setUser: (user: User) => void; clearUser: () => void };

export function applySession(session: Session | null, actions: StoreActions): void {
  setAccessTokenProvider(() => session?.access_token ?? null);
  if (session?.user) actions.setUser(session.user);
  else actions.clearUser();
}

export function useAuthSession(): { initializing: boolean } {
  const setUser = useAppStore((s) => s.setUser);
  const clearUser = useAppStore((s) => s.clearUser);
  const lock = useAppStore((s) => s.lock);
  const unlock = useAppStore((s) => s.unlock);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        applySession(data.session, { setUser, clearUser });
        // A session restored from storage means a cold start — gate it behind biometrics.
        if (data.session) lock();
      })
      .catch(() => {
        if (!active) return;
        applySession(null, { setUser, clearUser });
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION is the replay of the restored session, already handled by
      // getSession() above; skip it explicitly so restore stays locked.
      if (event === "INITIAL_SESSION") return;
      applySession(session, { setUser, clearUser });
      // Only an interactive sign-in proves identity — token refreshes, user updates,
      // etc. must not silently clear the lock.
      if (session && event === "SIGNED_IN") unlock();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setUser, clearUser, lock, unlock]);

  return { initializing };
}
