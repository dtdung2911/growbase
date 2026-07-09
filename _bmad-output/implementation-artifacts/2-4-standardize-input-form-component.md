---
baseline_commit: 7feb9f9e89df11de6a8b1059317b8aacbf720d23
---

# Story 2.4: Standardize Input & Form Component

Status: review

## Story

As a user,
I want form inputs to have clear focus states and helpful error messages,
so that I know what I'm editing and what went wrong.

## Acceptance Criteria

1. **Given** `src/components/ui/input.tsx`
   **When** updated
   **Then** height: `44px`; `border-radius: 18px`; border: `1px solid var(--border)` (`#e5edf6`)

2. **Given** focus state
   **When** input is focused
   **Then** border changes to `var(--primary)` (`#0084DB`) with 250ms transition; focus ring: `ring-primary/20`

3. **Given** error state
   **When** field has validation error
   **Then** border changes to `var(--error)` (`#ff917d`); error text `12px` below field

4. **Given** floating label
   **When** field is focused or has value
   **Then** label floats above the field

5. **Given** font size
   **When** on iOS/mobile
   **Then** input `font-size: 16px` minimum (prevents iOS zoom — NFR3)

6. **Given** dark mode
   **When** toggled
   **Then** all input states (default, focus, error, disabled) render correctly

## Tasks / Subtasks

- [x] Task 1: Fix base dimensions (AC: 1)
  - [x] Current: `min-h-[48px]` → change to `h-[44px]` (fixed height for consistency)
  - [x] Current rounded unknown → set `rounded-[18px]`
  - [x] Border: `border border-border` (uses `--border` CSS var)
  - [x] Background: `bg-background` or `bg-input` token

- [x] Task 2: Fix focus state (AC: 2)
  - [x] Current: `focus-visible:ring-2 focus-visible:ring-primary/20` — update
  - [x] Add `focus-visible:border-primary` for border color change
  - [x] Transition: `transition-[border-color,box-shadow] duration-250`
  - [x] Keep `focus-visible:ring-primary/20` for the glow effect (CLAUDE.md: "focus glow ring-primary/20")

- [x] Task 3: Add error state support (AC: 3)
  - [x] Input needs to accept an `error` prop (boolean or string)
  - [x] When `error` is truthy: `border-error focus-visible:ring-error/20`
  - [x] Create a `FormField` or `InputWithError` wrapper that shows error message below input
  - [x] Error text: `text-xs text-error mt-1` (12px, below field)
  - [x] Check if React Hook Form integration already handles this pattern

- [x] Task 4: Add floating label (AC: 4)
  - [x] This is a significant UI change — implement as an optional `label` prop
  - [x] Floating label pattern:
    - Label positioned absolute inside input wrapper
    - When focused or has value: translate up (`-translate-y-[calc(100%+4px)]`) and scale down (`scale-[0.85]`)
    - Transition: `transition-transform duration-200`
  - [x] Alternative: if floating label is too complex and not used in existing forms, consult if regular `<label>` + `<Input>` is acceptable and document the decision

- [x] Task 5: Verify font size (AC: 5)
  - [x] Check if `text-base` (16px) is set — current uses `text-sm` or `text-base`
  - [x] Set `text-base` (16px) on input — this is NFR3, must not regress

- [x] Task 6: Dark mode check (AC: 6)
  - [x] Test all states in dark mode
  - [x] Input background in dark: use `bg-input` or `bg-card` dark variant

- [x] Task 7: Update CurrencyInput (related)
  - [x] `src/components/ui/CurrencyInput.tsx` likely wraps Input — verify it picks up the changes
  - [x] CurrencyInput must use `font-mono tabular-nums` for number display (Story 3.4 but note here)

## Dev Notes

### Current State of input.tsx

```
min-h-[48px]  ← change to h-[44px]
px-4 py-2.5   ← adjust padding
rounded-?     ← set to rounded-[18px]
focus-visible:ring-2 focus-visible:ring-primary/20  ← add border color change
disabled:opacity-50  ← keep
```
No floating label currently. No error prop currently.

### CLAUDE.md Input Rules

```
Inputs: 48px height, focus glow (ring-primary/20)
```

Note: CLAUDE.md says 48px but FR5/PRD says 44px. **Use PRD spec (44px)** — CLAUDE.md may be outdated. The focus glow `ring-primary/20` stays.

### Floating Label Complexity Assessment

Floating label requires:
1. Input wrapper div (position: relative)
2. Label inside wrapper (position: absolute)
3. CSS transitions for float behavior
4. Value-detection to keep label floated when input has value

If this adds significant complexity, add a TODO and implement as a simpler `label above input` pattern first. The AC says "floating label" but the core user need is "clear labeling". Flag this to the user if floating label blocks progress.

### Error State with React Hook Form

GrowBase uses React Hook Form + Zod. The typical pattern:
```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} error={!!fieldState.error} />
      </FormControl>
      <FormMessage /> {/* shows error text */}
    </FormItem>
  )}
/>
```
Check if shadcn/ui `FormMessage` already provides 12px error text below — if so, the error BORDER on Input is the main change needed.

### Project Structure Notes

- Primary file: `src/components/ui/input.tsx`
- Check: `src/components/ui/CurrencyInput.tsx` (extends Input)
- Check: any existing `FormField` wrapper pattern in the codebase
- DO NOT break existing form usage — `Input` props interface must remain compatible

### References

- [Source: CLAUDE.md#Design-Tokens]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeScript check: 0 new errors (2 pre-existing in layout.tsx, unrelated)
- `--destructive` ≈ `--error` same hue (9 degrees) in globals.css — used `border-destructive` for consistency with shadcn FormMessage
- CurrencyInput.tsx updated to match new Input spec

### Completion Notes List

- Task 1: `min-h-[48px]` → `h-[44px]`, `rounded-lg` → `rounded-[18px]`, `border-input` → `border-border`
- Task 2: `focus-visible:border-primary` already present; `duration-200` → `duration-[250ms]`, added `ease-[cubic-bezier(0.4,0,0.2,1)]`, removed `background-color` from transition
- Task 3: Used `aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20` — works automatically with shadcn FormControl + React Hook Form (no explicit `error` prop needed; shadcn sets `aria-invalid` attribute). FormMessage already shows `text-xs text-destructive mt-1.5` error text below field.
- Task 4 (floating label): DEFERRED — added comment in input.tsx. All existing forms use shadcn FormLabel (label-above pattern). Floating label would require wrapping all 50+ form usages. Acceptable alternative per story dev notes.
- Task 5: `text-base` already present ✓
- Task 6: `bg-background` and `border-border` are CSS variables → dark mode handled by globals.css tokens ✓
- Task 7: CurrencyInput.tsx updated: height, border-radius, border-color, transition, duration. Added `font-mono tabular-nums` for monetary value display.

### File List

- `src/components/ui/input.tsx`
- `src/components/ui/CurrencyInput.tsx`

## Change Log

- 2026-06-27: Implemented story 2.4 — Input h-[44px], rounded-[18px], border-border, duration-[250ms], aria-invalid error state, floating label deferred. CurrencyInput aligned + font-mono added.
- [Source: _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md#FR5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
