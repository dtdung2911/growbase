import { useEffect } from "react";
import { AppState } from "react-native";
import { useAppStore } from "@/store/appStore";

const LOCK_TIMEOUT_MS = 60_000;

export function shouldRelock(
  backgroundedAt: number | null,
  now: number,
  timeoutMs: number,
): boolean {
  if (backgroundedAt === null) return false;
  const elapsed = now - backgroundedAt;
  // A negative elapsed time means the device clock moved backward while
  // backgrounded — treat as suspicious and re-lock rather than trust it.
  return elapsed < 0 || elapsed >= timeoutMs;
}

export function useBiometricLock(): void {
  const lock = useAppStore((s) => s.lock);

  useEffect(() => {
    let backgroundedAt: number | null = null;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        backgroundedAt = Date.now();
      } else if (state === "active") {
        if (shouldRelock(backgroundedAt, Date.now(), LOCK_TIMEOUT_MS)) lock();
        backgroundedAt = null;
      }
    });

    return () => sub.remove();
  }, [lock]);
}
