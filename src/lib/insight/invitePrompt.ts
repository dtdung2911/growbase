export const INVITE_PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

export function shouldShowInvitePrompt(
  memberCount: number,
  activeDaysLast7: number,
  dismissedAt: number | null,
  now: number
): boolean {
  if (memberCount !== 1) return false
  if (activeDaysLast7 < 5) return false
  if (dismissedAt !== null && now - dismissedAt < INVITE_PROMPT_COOLDOWN_MS) return false
  return true
}
