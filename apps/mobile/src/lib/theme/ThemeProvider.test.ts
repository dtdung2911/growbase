import { beforeEach, describe, expect, it, vi } from "vitest"

const store = vi.hoisted(() => new Map<string, string>())

// ThemeProvider imports useColorScheme/Appearance from react-native, which can't load in node.
vi.mock("react-native", () => ({
  useColorScheme: () => "light",
  Appearance: { getColorScheme: () => "light" },
}))
vi.mock("@/lib/storage/mmkv", () => ({
  appStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
  },
}))

import { persistThemeMode, readStoredMode, resolveIsDark } from "@/lib/theme/ThemeProvider"

beforeEach(() => store.clear())

describe("resolveIsDark", () => {
  it("follows the OS scheme in system mode", () => {
    expect(resolveIsDark("system", "dark")).toBe(true)
    expect(resolveIsDark("system", "light")).toBe(false)
    expect(resolveIsDark("system", null)).toBe(false)
    expect(resolveIsDark("system", undefined)).toBe(false)
  })

  it("uses the Appearance fallback when the live scheme is null", () => {
    expect(resolveIsDark("system", null, "dark")).toBe(true)
    expect(resolveIsDark("system", null, "light")).toBe(false)
  })

  it("ignores the OS scheme in explicit modes", () => {
    expect(resolveIsDark("dark", "light")).toBe(true)
    expect(resolveIsDark("light", "dark")).toBe(false)
  })
})

describe("theme mode persistence", () => {
  it("defaults to system when nothing is stored", () => {
    expect(readStoredMode()).toBe("system")
  })

  it("round-trips a persisted mode", () => {
    persistThemeMode("dark")
    expect(store.get("growbase-theme")).toBe("dark")
    expect(readStoredMode()).toBe("dark")
  })

  it("falls back to system on a garbage value", () => {
    store.set("growbase-theme", "neon")
    expect(readStoredMode()).toBe("system")
  })
})
