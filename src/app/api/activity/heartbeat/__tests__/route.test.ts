import { NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
}))

vi.mock("@/lib/supabase/auth-check", () => ({
  withAuth: mocks.withAuth,
}))

vi.mock("@/lib/utils/date", () => ({
  todayVN: vi.fn(() => "2026-07-08"),
}))

import { POST } from "../route"

describe("POST /api/activity/heartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when auth fails", async () => {
    mocks.withAuth.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    })

    const res = await POST()

    expect(res.status).toBe(401)
  })

  it("records today's VN activity idempotently", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    }

    mocks.withAuth.mockResolvedValue({
      error: null,
      supabase,
      user: { id: "u1" },
      householdId: "hh-1",
    })

    const res = await POST()

    expect(res.status).toBe(200)
    expect(supabase.from).toHaveBeenCalledWith("member_activity")
    expect(upsert).toHaveBeenCalledWith(
      {
        household_id: "hh-1",
        user_id: "u1",
        active_date: "2026-07-08",
      },
      { onConflict: "user_id,active_date", ignoreDuplicates: true }
    )
  })

  it("returns 500 when recording activity fails", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "DB error" } })
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    }

    mocks.withAuth.mockResolvedValue({
      error: null,
      supabase,
      user: { id: "u1" },
      householdId: "hh-1",
    })

    const res = await POST()
    expect(res.status).toBe(500)
  })
})
