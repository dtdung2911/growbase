import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
  verifyHouseholdMember: vi.fn(),
  inviteSchema: { safeParse: vi.fn() },
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock("@/lib/supabase/auth-check", () => ({
  withAuth: mocks.withAuth,
  verifyHouseholdMember: mocks.verifyHouseholdMember,
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mocks.supabaseAdmin,
}))

vi.mock("@growbase/shared/schemas/household", () => ({
  inviteSchema: mocks.inviteSchema,
}))

import { POST } from "../route"

const unauth = () =>
  NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })
const forbidden = () =>
  NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 })

// AD-2: INSERT vào household_invitations dùng supabaseAdmin, guards dùng user-scoped supabase
function makeSupabase(memberResult: unknown) {
  const memberChain = {
    select: vi.fn(() => memberChain),
    eq: vi.fn(() => memberChain),
    maybeSingle: vi.fn().mockResolvedValue(memberResult),
  }
  return { from: vi.fn(() => memberChain) }
}

function makeAdminInsertChain(insertResult: unknown) {
  const insertChain = {
    insert: vi.fn(() => insertChain),
    select: vi.fn(() => insertChain),
    single: vi.fn().mockResolvedValue(insertResult),
  }
  return insertChain
}

beforeEach(() => vi.clearAllMocks())

function makeReq(body: unknown) {
  return new Request("http://localhost/api/household/invite", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/household/invite", () => {
  it("calls withAuth() not withAuthUser()", async () => {
    mocks.withAuth.mockResolvedValue({ user: null, error: unauth() })
    await POST(makeReq({}))
    expect(mocks.withAuth).toHaveBeenCalledOnce()
  })

  it("returns 401 when unauthenticated", async () => {
    mocks.withAuth.mockResolvedValue({ user: null, error: unauth() })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ data: null, error: "Chưa đăng nhập" })
  })

  it("returns 400 when body invalid", async () => {
    const supabase = makeSupabase(null)
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, supabase, error: null })
    mocks.inviteSchema.safeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: "Email không hợp lệ" }] },
    })

    const res = await POST(makeReq({ bad: true }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ data: null, error: "Email không hợp lệ" })
  })

  it("calls verifyHouseholdMember with correct args", async () => {
    const supabase = makeSupabase(null)
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, supabase, error: null })
    mocks.inviteSchema.safeParse.mockReturnValue({
      success: true,
      data: { householdId: "hh-1", email: "a@b.com", display_name: "A", role: "member" },
    })
    mocks.verifyHouseholdMember.mockResolvedValue({ ok: false, error: forbidden() })

    await POST(makeReq({}))
    expect(mocks.verifyHouseholdMember).toHaveBeenCalledWith(supabase, "u1", "hh-1")
  })

  it("returns 403 when user is NOT member of the requested household (AD-6)", async () => {
    const supabase = makeSupabase(null)
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, supabase, error: null })
    mocks.inviteSchema.safeParse.mockReturnValue({
      success: true,
      data: { householdId: "hh-other", email: "a@b.com", display_name: "A", role: "member" },
    })
    mocks.verifyHouseholdMember.mockResolvedValue({ ok: false, error: forbidden() })

    const res = await POST(makeReq({}))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ data: null, error: "Forbidden" })
  })

  it("returns 403 when user is member but NOT owner", async () => {
    // member check (not owner) → returns null
    const supabase = makeSupabase({ data: null, error: null })
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, supabase, error: null })
    mocks.inviteSchema.safeParse.mockReturnValue({
      success: true,
      data: { householdId: "hh-1", email: "a@b.com", display_name: "A", role: "member" },
    })
    mocks.verifyHouseholdMember.mockResolvedValue({ ok: true })

    const res = await POST(makeReq({}))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.data).toBeNull()
    expect(body.error).toBe("Not household owner")
  })

  it("returns invite token + link when owner invites successfully, using supabaseAdmin for INSERT (AD-2)", async () => {
    const insertResult = { data: { token: "tok-abc" }, error: null }
    const supabase = makeSupabase({ data: { role: "owner" }, error: null })
    const adminInsertChain = makeAdminInsertChain(insertResult)
    mocks.supabaseAdmin.from.mockReturnValue(adminInsertChain)
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, supabase, error: null })
    mocks.inviteSchema.safeParse.mockReturnValue({
      success: true,
      data: { householdId: "hh-1", email: "b@c.com", display_name: "B", role: "member" },
    })
    mocks.verifyHouseholdMember.mockResolvedValue({ ok: true })

    const res = await POST(makeReq({}))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.error).toBeNull()
    expect(body.data.token).toBe("tok-abc")
    expect(body.data.inviteLink).toContain("/invite/tok-abc")
    expect(mocks.supabaseAdmin.from).toHaveBeenCalledWith("household_invitations")
    expect(supabase.from).not.toHaveBeenCalledWith("household_invitations")
  })
})
