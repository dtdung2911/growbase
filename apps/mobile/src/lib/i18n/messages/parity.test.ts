import { describe, expect, it } from "vitest"
import { en } from "@/lib/i18n/messages/en"
import { vi as viMessages } from "@/lib/i18n/messages/vi"

describe("i18n key parity", () => {
  it("vi and en expose an identical key set", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(viMessages).sort())
  })

  it("has no empty translations", () => {
    for (const value of [...Object.values(en), ...Object.values(viMessages)]) {
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
