import { toYearMonth } from "@growbase/shared/rules/date"
import { beforeEach, describe, expect, it, vi } from "vitest"

const blob = vi.hoisted(() => new Map<string, string>())

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

import { useAppStore } from "@/store/appStore"

beforeEach(() => {
  blob.clear()
  useAppStore.setState({
    householdId: null,
    currentMonth: "2000-01",
    user: null,
    isLocked: true,
    allHouseholds: [],
    isSwitchingHousehold: false,
  })
})

describe("appStore persistence", () => {
  it("persists only householdId (partialize) to the shared MMKV blob", () => {
    useAppStore.getState().setHouseholdId("h1")
    useAppStore.getState().setAllHouseholds([{ id: "h1", name: "Home", role: "owner" }])
    useAppStore.getState().setCurrentMonth("2024-05")

    const persisted = JSON.parse(blob.get("growbase-workspace") as string)
    expect(persisted.state).toEqual({ householdId: "h1" })
  })
})

describe("appStore.reset", () => {
  it("clears user/householdId/allHouseholds and resets month to the current month", () => {
    useAppStore.setState({
      user: { id: "u1" } as never,
      householdId: "h1",
      allHouseholds: [{ id: "h1", name: "Home", role: "owner" }],
      currentMonth: "2000-01",
      isLocked: false,
    })

    useAppStore.getState().reset()

    const s = useAppStore.getState()
    expect(s.user).toBeNull()
    expect(s.householdId).toBeNull()
    expect(s.allHouseholds).toEqual([])
    expect(s.currentMonth).toBe(toYearMonth())
  })

  it("clears isSwitchingHousehold so the overlay never survives a logout mid-switch", () => {
    useAppStore.setState({ isSwitchingHousehold: true })
    useAppStore.getState().reset()
    expect(useAppStore.getState().isSwitchingHousehold).toBe(false)
  })

  it("leaves isLocked untouched (lock behavior owned by auth flow)", () => {
    useAppStore.setState({ isLocked: true })
    useAppStore.getState().reset()
    expect(useAppStore.getState().isLocked).toBe(true)

    useAppStore.setState({ isLocked: false })
    useAppStore.getState().reset()
    expect(useAppStore.getState().isLocked).toBe(false)
  })
})
