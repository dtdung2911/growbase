import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type AppState = {
  householdId: string | null;
  currentMonth: string;
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  householdId: null,
  currentMonth: currentMonth(),
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, householdId: null }),
}));
