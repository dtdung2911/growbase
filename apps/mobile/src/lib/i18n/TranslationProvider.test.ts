import { beforeEach, describe, expect, it, vi } from "vitest"

const store = vi.hoisted(() => new Map<string, string>())

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

import { persistLocale, readStoredLocale } from "@/lib/i18n/TranslationProvider"

beforeEach(() => store.clear())

describe("locale persistence", () => {
  it("defaults to vi when nothing is stored", () => {
    expect(readStoredLocale()).toBe("vi")
  })

  it("reads a persisted en locale", () => {
    store.set("growbase-locale", "en")
    expect(readStoredLocale()).toBe("en")
  })

  it("round-trips a persisted locale", () => {
    persistLocale("en")
    expect(store.get("growbase-locale")).toBe("en")
    expect(readStoredLocale()).toBe("en")
  })

  it("falls back to vi on a garbage value", () => {
    store.set("growbase-locale", "fr")
    expect(readStoredLocale()).toBe("vi")
  })
})
