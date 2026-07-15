import { describe, it, expect, vi } from "vitest"

const mockMaybeSingle = vi.fn()
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(function (this: unknown) {
        return {
          eq: vi.fn(function (this: unknown) {
            return {
              eq: vi.fn(function (this: unknown) {
                return { maybeSingle: mockMaybeSingle }
              }),
            }
          }),
        }
      }),
    })),
  })),
} as unknown as import("@supabase/supabase-js").SupabaseClient

import { verifyHouseholdMember } from "../auth-check"

describe("verifyHouseholdMember", () => {
  it("returns { ok: true } when user is active member of household", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "m-1" }, error: null })

    const result = await verifyHouseholdMember(mockSupabase, "u-1", "hh-1")
    expect(result.ok).toBe(true)
  })

  it("returns { ok: false, error: 403 } when user is NOT member of household", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await verifyHouseholdMember(mockSupabase, "u-1", "hh-other")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.error.json()
      expect(result.error.status).toBe(403)
      expect(body).toEqual({ data: null, error: "Forbidden" })
    }
  })

  it("returns { ok: false, error: 403 } when DB returns null (member inactive)", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await verifyHouseholdMember(mockSupabase, "u-1", "hh-1")
    expect(result.ok).toBe(false)
  })
})
