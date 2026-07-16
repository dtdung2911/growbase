import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type AppState = {
  householdId: string | null;
  currentMonth: string;
  user: User | null;
  isLocked: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  lock: () => void;
  unlock: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  householdId: null,
  currentMonth: currentMonth(),
  user: null,
  // Starts locked every process launch so a cold start is never silently unlocked.
  isLocked: true,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, householdId: null }),
  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),
}));
