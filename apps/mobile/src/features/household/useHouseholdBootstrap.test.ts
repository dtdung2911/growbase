import type { HouseholdSummary } from "@growbase/shared/types/app"
import { describe, expect, it, vi } from "vitest"

// Isolate the pure selection logic from the query/store import chain.
vi.mock("react-native-mmkv", () => ({
  createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }),
}))
vi.mock("@/features/household/useHouseholds", () => ({ useHouseholds: () => ({ data: undefined }) }))

import { pickDefaultHousehold } from "@/features/household/useHouseholdBootstrap"

const A: HouseholdSummary = { id: "A", name: "A", role: "owner" }
const B: HouseholdSummary = { id: "B", name: "B", role: "member" }

describe("pickDefaultHousehold", () => {
  it("keeps the persisted household when it is still a member", () => {
    expect(pickDefaultHousehold("B", [A, B])).toBe("B")
  })

  it("falls back to the first membership when the persisted one is gone", () => {
    expect(pickDefaultHousehold("X", [A, B])).toBe("A")
  })

  it("selects the first membership when nothing is persisted", () => {
    expect(pickDefaultHousehold(null, [A, B])).toBe("A")
  })

  it("returns null when the user has zero households", () => {
    expect(pickDefaultHousehold("A", [])).toBeNull()
    expect(pickDefaultHousehold(null, [])).toBeNull()
  })
})
