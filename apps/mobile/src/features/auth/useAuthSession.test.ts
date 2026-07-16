import type { Session } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ provider: null as null | (() => string | null) }));

vi.mock("@/api/client", () => ({
  setAccessTokenProvider: (p: () => string | null) => {
    mocks.provider = p;
  },
}));

vi.mock("@/lib/supabase/client", () => ({ supabase: {} }));

import { applySession } from "@/features/auth/useAuthSession";

function sessionWith(token: string): Session {
  return { access_token: token, user: { id: "u1" } } as Session;
}

describe("applySession", () => {
  it("wires the token provider and setUser when a session is present", () => {
    const setUser = vi.fn();
    const clearUser = vi.fn();
    const session = sessionWith("tok-abc");

    applySession(session, { setUser, clearUser });

    expect(mocks.provider?.()).toBe("tok-abc");
    expect(setUser).toHaveBeenCalledWith(session.user);
    expect(clearUser).not.toHaveBeenCalled();
  });

  it("provider returns null and clearUser fires when session is null", () => {
    const setUser = vi.fn();
    const clearUser = vi.fn();

    applySession(null, { setUser, clearUser });

    expect(mocks.provider?.()).toBeNull();
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(setUser).not.toHaveBeenCalled();
  });
});
