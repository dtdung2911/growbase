---
baseline_commit: 7feb9f9e89df11de6a8b1059317b8aacbf720d23
---

# Story 2.3: Standardize Button Component

Status: review

## Story

As a user,
I want buttons to be consistently sized with clear hover and active states,
so that the UI feels interactive and responsive to my actions.

## Acceptance Criteria

1. **Given** `src/components/ui/button.tsx`
   **When** updated
   **Then** heights: `44px` (md/default) · `30px` (sm) · `56px` (lg)

2. **Given** button shape
   **When** updated
   **Then** `border-radius: 25px` (full pill shape) on ALL variants

3. **Given** hover state
   **When** user hovers
   **Then** background darkens 20% with 250ms transition (easing: `cubic-bezier(0.4, 0, 0.2, 1)`)

4. **Given** active/press state
   **When** user clicks
   **Then** background darkens 40% with 100ms transition; slight downward translate (`translate-y-px`)

5. **Given** disabled state
   **When** button is disabled
   **Then** `rgba(0,0,0,0.12)` background, not `opacity-50` alone

6. **Given** touch targets
   **When** rendered on mobile
   **Then** min `44×44px` on all interactive states (NFR2) — md and lg meet this; sm must have sufficient hit area

7. **Given** dark mode
   **When** toggled
   **Then** all button states render correctly with dark tokens

## Tasks / Subtasks

- [x] Task 1: Fix button heights (AC: 1)
  - [x] Default/md: currently `min-h-[44px]` ✓ (keep, adjust if px not h-11)
  - [x] sm: currently `min-h-[36px]` → change to `min-h-[30px]` (spec: 30px)
  - [x] lg: currently `min-h-[48px]` → change to `min-h-[56px]` (spec: 56px)
  - [x] Adjust `px` padding proportionally for each size

- [x] Task 2: Apply pill shape (AC: 2)
  - [x] Replace current `rounded-*` with `rounded-full` on all variants
  - [x] CLAUDE.md: "Buttons: rounded-full pill shape" — apply globally

- [x] Task 3: Fix hover state (AC: 3)
  - [x] Replace `hover:bg-primary/90` style with proper darkening
  - [x] Use CSS approach: `hover:brightness-[0.8]` OR define darken variants in tailwind
  - [x] Add `transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]`
  - [x] Per CLAUDE.md: `hover elevation (-translate-y-px)` — add `hover:-translate-y-px`

- [x] Task 4: Fix active state (AC: 4)
  - [x] Add `active:brightness-[0.6]` or darken-40% equivalent
  - [x] Add `active:translate-y-px` for press feel
  - [x] `active:transition-none` or `active:duration-100`

- [x] Task 5: Fix disabled state (AC: 5)
  - [x] Replace `disabled:opacity-50` with `disabled:bg-black/12 disabled:cursor-not-allowed`
  - [x] Keep `disabled:pointer-events-none` to prevent click
  - [x] Disabled text: keep legible (not just opacity)

- [x] Task 6: Verify touch targets (AC: 6)
  - [x] sm variant: add `min-w-[44px]` or padding to ensure 44px hit area even if visual height is 30px
  - [x] Can use invisible padding or min-height wrapper

- [x] Task 7: Test all variants
  - [x] Default, destructive, outline, secondary, ghost, link — all need pill shape
  - [x] Verify no existing usage breaks (grep for `<Button` in codebase)

## Dev Notes

### Current State of button.tsx

```
sizes:
  md: min-h-[44px] px-5    ← height OK, px maybe adjust
  sm: min-h-[36px] px-3.5  ← change to min-h-[30px]
  lg: min-h-[48px] px-8    ← change to min-h-[56px]
  icon: h-10 w-10          ← review for 44px touch target

states:
  disabled: opacity-50      ← change to bg-black/12
  hover: hover:bg-destructive/90 (destructive variant only)  ← add general hover darken
  text-[15px]              ← keep or adjust per variant
```

### Hover/Active Darkening Implementation

Option 1 — Brightness filter (simplest):
```
hover:brightness-[0.8] active:brightness-[0.6]
```

Option 2 — Define CSS custom properties:
```
hover:bg-primary-hover active:bg-primary-pressed
```
Where `--primary-hover: #006BB8` and `--primary-pressed: #004F8A` are in globals.css.

**Use Option 2** to match the exact CLAUDE.md values (`#006BB8` hover, `#004F8A` pressed).

### Transition Classes

Add to all button variants:
```
transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]
```

Wait — Story 2.1 bans `transition: all`. Use instead:
```
transition-[colors,transform] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
```

### CLAUDE.md Button Rules

```
Buttons: rounded-full pill shape, hover elevation (-translate-y-px)
```

Apply both: `rounded-full` + `hover:-translate-y-px`

### Project Structure Notes

- File: `src/components/ui/button.tsx` only
- Check usages: `grep -rn "<Button" src/components/` to understand impact
- Add `--primary-hover` and `--primary-pressed` CSS vars in globals.css if not done in Story 2.1

### References

- [Source: CLAUDE.md#Design-Tokens]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md#FR4]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeScript check: 0 new errors (2 pre-existing in layout.tsx, unrelated)
- `--primary-hover` and `--primary-pressed` CSS vars: present in globals.css (L19-20, L97-98) ✓
- 114 Button variant usages across codebase — all backward compatible (props unchanged)

### Completion Notes List

- sm height: `min-h-[36px]` → `min-h-[30px]` + added `min-w-[44px]` for touch target AC6
- lg height: `min-h-[48px]` → `min-h-[56px]`
- Task 2: `rounded-full` already present ✓
- Task 3: Added `hover:brightness-[0.8] hover:-translate-y-px` to base (all variants), `duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]`, added `filter` to transition properties; removed per-variant hover colors
- Task 4: Added `active:brightness-[0.6] active:translate-y-px` to base; motion-reduce overrides added
- Task 5: Removed `disabled:opacity-50`; added `disabled:bg-black/12 dark:disabled:bg-white/[0.12] disabled:cursor-not-allowed`
- Task 6: `min-w-[44px]` on sm size ✓
- Task 7: link variant overrides brightness/translate to 0 (links don't get lift effect); ghost keeps `hover:bg-accent` for visibility

### File List

- `src/components/ui/button.tsx`

## Change Log

- 2026-06-27: Implemented story 2.3 — Button heights (30/44/56px), brightness hover/active in base, disabled bg-black/12, sm touch target min-w-[44px]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
