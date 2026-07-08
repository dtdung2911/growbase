import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
}))

vi.mock("@/lib/supabase/auth-check", () => ({
  withAuth: mocks.withAuth,
}))

import { POST } from "../route"

const unauth = () =>
  NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })

function makeSupabase(upsertResult: unknown) {
  const chain = { upsert: vi.fn().mockResolvedValue(upsertResult) }
  return { from: vi.fn(() => chain), _chain: chain }
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/activity/heartbeat", () => {
  it("returns 401 when unauthenticated (withAuth first)", async () => {
    mocks.withAuth.mockResolvedValue({ error: unauth() })
    const res = await POST()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ data: null, error: "Chưa đăng nhập" })
  })

  it("upserts idempotently (onConflict user_id+active_date, ignoreDuplicates)", async () => {
    const supabase = makeSupabase({ error: null })
    mocks.withAuth.mockResolvedValue({
      supabase,
      user: { id: "u1" },
      householdId: "hh-1",
      error: null,
    })

    const first = await POST()
    const second = await POST()

    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ data: { recorded: true }, error: null })
    expect(await second.json()).toEqual({ data: { recorded: true }, error: null })

    expect(supabase.from).toHaveBeenCalledWith("member_activity")
    expect(supabase._chain.upsert).toHaveBeenCalledWith(
      { household_id: "hh-1", user_id: "u1" },
      { onConflict: "user_id,active_date", ignoreDuplicates: true }
    )
  })

  it("returns 500 when upsert fails", async () => {
    const supabase = makeSupabase({ error: { message: "db down" } })
    mocks.withAuth.mockResolvedValue({
      supabase,
      user: { id: "u1" },
      householdId: "hh-1",
      error: null,
    })
    const res = await POST()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ data: null, error: "db down" })
  })
})
