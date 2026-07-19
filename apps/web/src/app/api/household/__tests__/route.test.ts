import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
  withAuthUser: vi.fn(),
  supabaseAdmin: { from: vi.fn() },
  householdSchema: { safeParse: vi.fn() },
  updateHouseholdSchema: { safeParse: vi.fn() },
}))

vi.mock("@/lib/supabase/auth-check", () => ({
  withAuth: mocks.withAuth,
  withAuthUser: mocks.withAuthUser,
}))

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: mocks.supabaseAdmin,
}))

vi.mock("@growbase/shared/schemas/household", () => ({
  householdSchema: mocks.householdSchema,
}))

vi.mock("@growbase/shared/schemas/household-settings", () => ({
  updateHouseholdSchema: mocks.updateHouseholdSchema,
}))

import { GET, POST, PUT } from "../route"

const unauthorizedResponse = () =>
  NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })

function makeChain(leafResult: unknown) {
  const chain: Record<string, unknown> = {}
  ;["select", "eq", "order", "limit", "update", "insert"].forEach(
    (m) => { chain[m] = vi.fn(() => chain) }
  )
  chain.maybeSingle = vi.fn().mockResolvedValue(leafResult)
  chain.single = vi.fn().mockResolvedValue(leafResult)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/household", () => {
  it("calls withAuth, not withAuthUser", async () => {
    mocks.withAuth.mockResolvedValue({ user: null, error: unauthorizedResponse() })

    await GET()

    expect(mocks.withAuth).toHaveBeenCalledOnce()
    expect(mocks.withAuthUser).not.toHaveBeenCalled()
  })

  it("returns 401 shape when unauthenticated", async () => {
    mocks.withAuth.mockResolvedValue({ user: null, error: unauthorizedResponse() })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body).toEqual({ data: null, error: "Chưa đăng nhập" })
  })

  it("returns { data: null, error: null } when no household found", async () => {
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, error: null })
    mocks.supabaseAdmin.from.mockReturnValue(makeChain({ data: null, error: null }))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ data: null, error: null })
  })

  it("strips household_members from response data", async () => {
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, error: null })
    const hh = {
      id: "hh-1", name: "Nhà Duong", household_type: "family", currency: "VND",
      onboarding_completed: true,
      household_members: [{ user_id: "u1", role: "owner" }],
    }
    mocks.supabaseAdmin.from.mockReturnValue(makeChain({ data: hh, error: null }))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).not.toHaveProperty("household_members")
    expect(body.data.id).toBe("hh-1")
    expect(body.error).toBeNull()
  })
})

describe("POST /api/household", () => {
  it("calls withAuthUser (not withAuth) — AD-2 onboarding system op", async () => {
    mocks.withAuthUser.mockResolvedValue({ user: null, error: unauthorizedResponse() })

    const req = new Request("http://localhost/api/household", {
      method: "POST",
      body: JSON.stringify({}),
    })
    await POST(req)

    expect(mocks.withAuthUser).toHaveBeenCalledOnce()
    expect(mocks.withAuth).not.toHaveBeenCalled()
  })

  it("returns 401 shape when unauthenticated", async () => {
    mocks.withAuthUser.mockResolvedValue({ user: null, error: unauthorizedResponse() })

    const req = new Request("http://localhost/api/household", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body).toEqual({ data: null, error: "Chưa đăng nhập" })
  })

  it("returns 400 with { data: null, error: string } for invalid body", async () => {
    mocks.withAuthUser.mockResolvedValue({ user: { id: "u1" }, error: null })
    mocks.householdSchema.safeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: "Tên không được để trống" }] },
    })

    const req = new Request("http://localhost/api/household", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.data).toBeNull()
    expect(body.error).toBe("Tên không được để trống")
  })
})

describe("PUT /api/household", () => {
  it("calls withAuth, not withAuthUser", async () => {
    mocks.withAuth.mockResolvedValue({ user: null, error: unauthorizedResponse() })

    const req = new Request("http://localhost/api/household", {
      method: "PUT",
      body: JSON.stringify({}),
    })
    await PUT(req)

    expect(mocks.withAuth).toHaveBeenCalledOnce()
    expect(mocks.withAuthUser).not.toHaveBeenCalled()
  })

  it("returns 401 when unauthenticated", async () => {
    mocks.withAuth.mockResolvedValue({ user: null, error: unauthorizedResponse() })

    const req = new Request("http://localhost/api/household", {
      method: "PUT",
      body: JSON.stringify({}),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body).toEqual({ data: null, error: "Chưa đăng nhập" })
  })

  it("returns 403 with correct shape when user is not owner", async () => {
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, error: null })
    mocks.supabaseAdmin.from.mockReturnValue(makeChain({ data: null, error: null }))

    const req = new Request("http://localhost/api/household", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.data).toBeNull()
    expect(typeof body.error).toBe("string")
  })

  it("returns 400 with { data: null, error: string } for invalid body when owner", async () => {
    mocks.withAuth.mockResolvedValue({ user: { id: "u1" }, error: null })
    const memberChain = makeChain({ data: { household_id: "hh-1", role: "owner" }, error: null })
    mocks.supabaseAdmin.from.mockReturnValueOnce(memberChain)
    mocks.updateHouseholdSchema.safeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: "Dữ liệu không hợp lệ" }] },
    })

    const req = new Request("http://localhost/api/household", {
      method: "PUT",
      body: JSON.stringify({}),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.data).toBeNull()
    expect(body.error).toBe("Dữ liệu không hợp lệ")
  })
})
