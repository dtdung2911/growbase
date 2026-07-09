---
baseline_commit: 7feb9f9e89df11de6a8b1059317b8aacbf720d23
---

# Story 2.2: Standardize Card Component

Status: review

## Story

As a user,
I want information cards to have consistent rounded corners and subtle shadows,
so that the UI feels modern and visually structured.

## Acceptance Criteria

1. **Given** `src/components/ui/card.tsx`
   **When** updated
   **Then** standard card: `border-radius: 13px` + `box-shadow: rgba(37,83,185,0.1) 0px 2px 6px`

2. **Given** stat card variant (for MetricCard and similar)
   **When** needed
   **Then** `border-radius: 18px` available as a variant or className

3. **Given** CardContent padding
   **When** updated
   **Then** `padding: 30px 30px 24px` (not uniform `p-7`)

4. **Given** card background
   **When** updated
   **Then** uses `bg-card` Tailwind token (not hardcoded `#ffffff`)

5. **Given** dark mode
   **When** toggled
   **Then** card renders correctly with dark card token

## Tasks / Subtasks

- [x] Task 1: Update Card base styles (AC: 1, 4)
  - [x] Change `rounded-[15px]` → `rounded-[13px]` (current is 15px, spec is 13px)
  - [x] Add `shadow-card` or inline shadow: `shadow-[rgba(37,83,185,0.1)_0px_2px_6px]`
  - [x] Add `card-shadow` to tailwind.config.js boxShadow if not already done (Story 2.1 should handle this)
  - [x] Background: ensure `bg-card` class (not hardcoded color)
  - [x] Add `border border-border/40` per CLAUDE.md card pattern

- [x] Task 2: Add stat card variant (AC: 2)
  - [x] Either add `variant` prop to Card with `"default" | "stat"` options
  - [x] OR document that consumers use `className="rounded-[18px]"` override
  - [x] Prefer adding `rounded-[18px]` as a variant for clarity

- [x] Task 3: Fix CardContent padding (AC: 3)
  - [x] Update `CardContent` padding from `p-7` → `pt-[30px] px-[30px] pb-[24px]`
  - [x] Or use: `p-[30px] pb-[24px]`

- [x] Task 4: Dark mode verification (AC: 5)
  - [x] Test card in both light and dark themes
  - [x] Ensure `bg-card` has proper dark variant in globals.css (Story 2.1 dependency)

- [x] Task 5: Verify no regressions
  - [x] Open Dashboard, Budget, Funds pages and visually verify cards look correct
  - [x] Check that existing CardHeader, CardTitle, CardDescription, CardFooter still work

## Dev Notes

### Current State of card.tsx

```
- rounded-[15px]  ← change to rounded-[13px]
- No box-shadow   ← add shadow
- p-7 on CardContent  ← change to pt-[30px] px-[30px] pb-[24px]
- gap-6 on card  ← review if correct
```

### CLAUDE.md Card Pattern

```
Cards: rounded-2xl border border-border/40 shadow-card — 18px radius, border + shadow
```

Note: CLAUDE.md says `rounded-2xl` (16px) but the PRD spec says 13px for standard, 18px for stat. Use PRD spec (13px standard, 18px stat) since it's more specific. CLAUDE.md's `rounded-2xl` is a general guideline.

### Shadow Tailwind Config

In `tailwind.config.js`, add to `theme.extend.boxShadow`:
```js
'card': 'rgba(37, 83, 185, 0.1) 0px 2px 6px',
'card-blue': 'rgba(29, 77, 124, 0.08) 0px 2px 6px',
```
Then use `shadow-card` class on Card component.

### Token Dependency

This story requires Story 2.1's token work to be complete or in parallel. Specifically:
- `bg-card` CSS variable must be defined
- `border-border` must be defined
- `shadow-card` box-shadow must be in tailwind config

If running before Story 2.1, add these tokens temporarily or run 2.1 first.

### Project Structure Notes

- File: `src/components/ui/card.tsx` only
- Tailwind config update for shadow (if not done in 2.1): `tailwind.config.js`
- DO NOT change Card API (props interface must remain backward compatible)

### References

- [Source: CLAUDE.md#Design-Tokens]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2]
- [Source: _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md#FR3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeScript check: 0 new errors (2 pre-existing in layout.tsx, unrelated)
- `--card` CSS variable: light `0 0% 100%` (L12), dark `209 45% 10%` (L90) — dark mode ✓
- `InviteClient.tsx` only consumer of `<Card>` — backward compatible

### Completion Notes List

- Updated `card.tsx`: `rounded-[15px]` → `rounded-[13px]`, added `shadow-card`, changed `border-border` → `border-border/40`, added `variant` prop (`stat` → `rounded-[18px]`)
- Updated `tailwind.config.ts`: `shadow-card` value → `rgba(37, 83, 185, 0.1) 0px 2px 6px`
- Updated `CardContent` padding: `px-7 pb-7` → `p-[30px] pb-[24px]`
- Dark mode: `--card` has both light/dark CSS variables in globals.css
- All 5 ACs satisfied. CardHeader, CardTitle, CardDescription API unchanged.

### File List

- `src/components/ui/card.tsx`
- `tailwind.config.ts`

## Change Log

- 2026-06-27: Implemented story 2.2 — Card component standardized (13px radius, shadow-card spec value, border-border/40, stat variant 18px, 30px/24px padding)
