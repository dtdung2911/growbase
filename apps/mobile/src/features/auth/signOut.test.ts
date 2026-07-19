import { beforeEach, describe, expect, it, vi } from "vitest"

const signOut = vi.hoisted(() => vi.fn<() => Promise<{ error: null }>>())
const purge = vi.hoisted(() => vi.fn<() => Promise<void>>())
const replace = vi.hoisted(() => vi.fn())
const blob = vi.hoisted(() => new Map<string, string>())

vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { signOut } } }))
vi.mock("@/lib/query/queryClient", () => ({ purgeQueryCache: purge }))
vi.mock("expo-router", () => ({ router: { replace } }))
vi.mock("react-native-mmkv", () => ({
  createMMKV: () => ({
    getString: (k: string) => blob.get(k),
    set: (k: string, v: string) => {
      blob.set(k, v)
    },
    remove: (k: string) => {
      blob.delete(k)
    },
  }),
}))

import { signOutAndPurge } from "@/features/auth/signOut"
import { useAppStore } from "@/store/appStore"

beforeEach(() => {
  blob.clear()
  signOut.mockReset()
  signOut.mockResolvedValue({ error: null })
  purge.mockReset()
  purge.mockResolvedValue(undefined)
  replace.mockReset()
  useAppStore.setState({
    user: { id: "u1" } as never,
    householdId: "h1",
    allHouseholds: [{ id: "h1", name: "Home", role: "owner" }],
    isSwitchingHousehold: false,
  })
})

function expectFullyCleared() {
  const s = useAppStore.getState()
  expect(s.user).toBeNull()
  expect(s.householdId).toBeNull()
  expect(s.allHouseholds).toEqual([])
  expect(blob.has("growbase-workspace")).toBe(false)
  expect(replace).toHaveBeenCalledWith("/login")
}

describe("signOutAndPurge", () => {
  it("clears session, cache, persisted blob, and store, then routes to /login", async () => {
    await signOutAndPurge()

    expect(signOut).toHaveBeenCalledOnce()
    expect(purge).toHaveBeenCalledOnce()
    expectFullyCleared()
  })

  it("still fully clears and routes when signOut throws", async () => {
    signOut.mockRejectedValue(new Error("network"))

    await expect(signOutAndPurge()).resolves.toBeUndefined()

    expect(purge).toHaveBeenCalledOnce()
    expectFullyCleared()
  })

  it("still fully clears and routes when the cache purge throws", async () => {
    purge.mockRejectedValue(new Error("mmkv io"))

    await expect(signOutAndPurge()).resolves.toBeUndefined()

    expectFullyCleared()
  })
})
