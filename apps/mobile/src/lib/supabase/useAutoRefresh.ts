import { useEffect } from "react";
import { AppState } from "react-native";
import { supabase } from "@/lib/supabase/client";

// Supabase RN pattern: refresh only while the app is foregrounded.
export function useAutoRefresh(): void {
  useEffect(() => {
    if (AppState.currentState === "active") supabase.auth.startAutoRefresh();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);
}
