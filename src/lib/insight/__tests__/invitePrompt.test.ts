import { describe, it, expect } from "vitest"
import { shouldShowInvitePrompt, INVITE_PROMPT_COOLDOWN_MS } from "../invitePrompt"

const NOW = 1_700_000_000_000

describe("shouldShowInvitePrompt", () => {
  it("false when active days < 5 (boundary 4)", () => {
    expect(shouldShowInvitePrompt(1, 4, null, NOW)).toBe(false)
  })

  it("true when active days = 5 (boundary), member=1, not dismissed", () => {
    expect(shouldShowInvitePrompt(1, 5, null, NOW)).toBe(true)
  })

  it("false when household has 2+ members regardless of activity", () => {
    expect(shouldShowInvitePrompt(2, 7, null, NOW)).toBe(false)
  })

  it("false while inside 14-day cooldown", () => {
    const dismissedAt = NOW - (INVITE_PROMPT_COOLDOWN_MS - 1000)
    expect(shouldShowInvitePrompt(1, 5, dismissedAt, NOW)).toBe(false)
  })

  it("true after cooldown elapsed", () => {
    const dismissedAt = NOW - (INVITE_PROMPT_COOLDOWN_MS + 1000)
    expect(shouldShowInvitePrompt(1, 5, dismissedAt, NOW)).toBe(true)
  })
})
