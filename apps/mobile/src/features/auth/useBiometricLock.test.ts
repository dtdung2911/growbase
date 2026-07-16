import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  AppState: { addEventListener: () => ({ remove: () => {} }) },
}));

import { shouldRelock } from "@/features/auth/useBiometricLock";

const TIMEOUT = 60_000;

describe("shouldRelock", () => {
  it("stays unlocked when backgrounded for less than the timeout", () => {
    expect(shouldRelock(1000, 1000 + 59_000, TIMEOUT)).toBe(false);
  });

  it("re-locks once the elapsed time reaches the timeout", () => {
    expect(shouldRelock(1000, 1000 + TIMEOUT, TIMEOUT)).toBe(true);
  });

  it("stays unlocked when there is no recorded background time", () => {
    expect(shouldRelock(null, 999_999, TIMEOUT)).toBe(false);
  });

  it("re-locks when the clock moved backward while backgrounded", () => {
    expect(shouldRelock(10_000, 5_000, TIMEOUT)).toBe(true);
  });
});
