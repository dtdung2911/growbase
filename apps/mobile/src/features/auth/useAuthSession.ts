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
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        applySession(data.session, { setUser, clearUser });
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session, { setUser, clearUser });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setUser, clearUser]);

  return { initializing };
}
