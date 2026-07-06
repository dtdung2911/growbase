import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
}))

vi.mock("@/lib/supabase/auth-check", () => ({
  withAuth: mocks.withAuth,
}))

import { GET } from "../route"

const unauth = () =>
  NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })

function makeSupabase(membersResult: unknown, invitationsResult: unknown) {
  const membersChain = {
    select: vi.fn(() => membersChain),
    eq: vi.fn(() => membersChain),
    order: vi.fn().mockResolvedValue(membersResult),
  }
  const invitationsChain = {
    select: vi.fn(() => invitationsChain),
    eq: vi.fn(() => invitationsChain),
    order: vi.fn().mockResolvedValue(invitationsResult),
  }
  return {
    from: vi.fn((table: string) =>
      table === "household_members" ? membersChain : invitationsChain
    ),
  }
}

beforeEach(() => vi.clearAllMocks())

describe("GET /api/household/members", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.withAuth.mockResolvedValue({ user: null, error: unauth() })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("includes invitation token when requester is owner", async () => {
    const membersResult = {
      data: [
        {
          id: "m1",
          household_id: "hh-1",
          user_id: "u1",
          display_name: "A",
          role: "owner",
          joined_at: "t",
          is_active: true,
        },
      ],
      error: null,
    }
    const invitationsResult = {
      data: [
        {
          id: "i1",
          household_id: "hh-1",
          email: "b@c.com",
          display_name: "B",
          role: "member",
          token: "tok-abc",
          status: "pending",
          expires_at: "t",
          created_at: "t",
        },
      ],
      error: null,
    }
    const supabase = makeSupabase(membersResult, invitationsResult)
    mocks.withAuth.mockResolvedValue({
      user: { id: "u1" },
      supabase,
      householdId: "hh-1",
      error: null,
    })

    const res = await GET()
    const body = await res.json()
    expect(body.data.invitations[0].token).toBe("tok-abc")
  })

  it("strips invitation token when requester is NOT owner (security fix)", async () => {
    const membersResult = {
      data: [
        {
          id: "m1",
          household_id: "hh-1",
          user_id: "u1",
          display_name: "A",
          role: "member",
          joined_at: "t",
          is_active: true,
        },
        {
          id: "m2",
          household_id: "hh-1",
          user_id: "u2",
          display_name: "Owner",
          role: "owner",
          joined_at: "t",
          is_active: true,
        },
      ],
      error: null,
    }
    const invitationsResult = {
      data: [
        {
          id: "i1",
          household_id: "hh-1",
          email: "b@c.com",
          display_name: "B",
          role: "member",
          token: "tok-abc",
          status: "pending",
          expires_at: "t",
          created_at: "t",
        },
      ],
      error: null,
    }
    const supabase = makeSupabase(membersResult, invitationsResult)
    mocks.withAuth.mockResolvedValue({
      user: { id: "u1" },
      supabase,
      householdId: "hh-1",
      error: null,
    })

    const res = await GET()
    const body = await res.json()
    expect(body.data.invitations[0]).not.toHaveProperty("token")
  })
})
