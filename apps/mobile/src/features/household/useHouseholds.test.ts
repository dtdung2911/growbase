import type { HouseholdSummary } from "@growbase/shared/types/app"
import { beforeEach, describe, expect, it, vi } from "vitest"

const apiFetch = vi.hoisted(() => vi.fn())
const storeRef = vi.hoisted(() => ({ state: { user: null as unknown, isLocked: true } }))

vi.mock("@/api/client", () => ({ apiFetch }))
vi.mock("@/store/appStore", () => ({
  useAppStore: (selector: (s: { user: unknown; isLocked: boolean }) => unknown) =>
    selector(storeRef.state),
}))
// The hook is a thin useQuery wrapper; capture the options object to inspect wiring.
vi.mock("@tanstack/react-query", () => ({ useQuery: (options: unknown) => options }))

import { useHouseholds } from "@/features/household/useHouseholds"

type CapturedQuery = {
  queryKey: readonly unknown[]
  queryFn: () => Promise<HouseholdSummary[]>
  enabled: boolean
}

beforeEach(() => {
  apiFetch.mockReset()
  storeRef.state = { user: null, isLocked: true }
})

describe("useHouseholds", () => {
  it("is disabled until the user is authenticated and unlocked", () => {
    storeRef.state = { user: null, isLocked: true }
    expect((useHouseholds() as unknown as CapturedQuery).enabled).toBe(false)

    storeRef.state = { user: { id: "u1" }, isLocked: true }
    expect((useHouseholds() as unknown as CapturedQuery).enabled).toBe(false)
  })

  it("fetches households through apiFetch and unwraps the envelope", async () => {
    const households: HouseholdSummary[] = [{ id: "h1", name: "Home", role: "owner" }]
    apiFetch.mockResolvedValue(households)
    storeRef.state = { user: { id: "u1" }, isLocked: false }

    const query = useHouseholds() as unknown as CapturedQuery
    expect(query.enabled).toBe(true)
    expect(query.queryKey).toEqual(["households"])

    await expect(query.queryFn()).resolves.toEqual(households)
    expect(apiFetch).toHaveBeenCalledWith("/api/households")
  })
})
