import { beforeEach, describe, expect, it, vi } from "vitest"

const purge = vi.hoisted(() => vi.fn<() => Promise<void>>())
const blob = vi.hoisted(() => new Map<string, string>())

vi.mock("@/lib/query/queryClient", () => ({ purgeQueryCache: purge }))
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

import { switchHousehold } from "@/features/household/switchHousehold"
import { useAppStore } from "@/store/appStore"

beforeEach(() => {
  blob.clear()
  purge.mockReset()
  purge.mockResolvedValue(undefined)
  useAppStore.setState({ householdId: "A", isSwitchingHousehold: false })
})

describe("switchHousehold", () => {
  it("is a no-op when switching to the current household", async () => {
    await switchHousehold("A")
    expect(purge).not.toHaveBeenCalled()
    expect(useAppStore.getState().isSwitchingHousehold).toBe(false)
  })

  it("purges the cache before setting the new household and toggles the flag", async () => {
    purge.mockImplementation(async () => {
      // Purge must run while still on the old household and while switching.
      expect(useAppStore.getState().householdId).toBe("A")
      expect(useAppStore.getState().isSwitchingHousehold).toBe(true)
    })

    await switchHousehold("B")

    expect(purge).toHaveBeenCalledOnce()
    expect(useAppStore.getState().householdId).toBe("B")
    expect(useAppStore.getState().isSwitchingHousehold).toBe(false)
  })

  it("resets the flag and does not half-switch when purge throws", async () => {
    purge.mockRejectedValue(new Error("boom"))

    await expect(switchHousehold("B")).rejects.toThrow("boom")

    expect(useAppStore.getState().householdId).toBe("A")
    expect(useAppStore.getState().isSwitchingHousehold).toBe(false)
  })
})
