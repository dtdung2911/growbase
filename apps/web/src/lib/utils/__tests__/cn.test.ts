import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils/cn"

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1")
  })

  it("drops falsy conditional classes", () => {
    expect(cn("base", false && "hidden", null, undefined, "")).toBe("base")
  })

  it("keeps truthy conditional classes", () => {
    const active = true
    expect(cn("base", active && "active")).toBe("base active")
  })

  it("merges conflicting Tailwind utilities (last wins)", () => {
    // tailwind-merge: px-4 ghi đè px-2
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("resolves conflicting color utilities (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("supports array inputs (clsx behavior)", () => {
    expect(cn(["px-2", "py-1"])).toBe("px-2 py-1")
  })

  it("supports object syntax for conditional classes", () => {
    expect(cn({ "is-open": true, "is-closed": false })).toBe("is-open")
  })

  it("returns empty string for no/empty input", () => {
    expect(cn()).toBe("")
    expect(cn("", null, undefined, false)).toBe("")
  })

  it("does not duplicate non-conflicting classes but merges conflicts", () => {
    expect(cn("p-4 text-sm", "p-2")).toBe("text-sm p-2")
  })
})
