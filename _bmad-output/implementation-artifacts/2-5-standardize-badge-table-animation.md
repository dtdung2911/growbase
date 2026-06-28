---
baseline_commit: 7feb9f9e89df11de6a8b1059317b8aacbf720d23
---

# Story 2.5: Standardize Badge, Table & Animation System

Status: review

## Story

As a user,
I want status badges and data tables to be visually distinct, and UI transitions to feel smooth,
so that I can quickly scan data and experience a polished interface.

## Acceptance Criteria

**Badge (`src/components/ui/badge.tsx`):**
1. Height: `24px`; `border-radius: 16px`; `font-size: 12px; font-weight: 600`
2. Tinted style: light background + matching border + darker text (NOT solid fill)
3. Semantic variants: `success` (green tint), `warning` (orange tint), `error` (red tint), `info` (blue tint), `default`
4. All variants work in dark mode

**Table (shared table styles):**
5. Always rendered inside a card with `border-radius: 13px`
6. Header: `font-size: 12px; font-weight: 500`
7. Body rows: `font-size: 12px; font-weight: 400`
8. Row separator: `border-bottom: 1px solid var(--border)`
9. Works in dark mode

**Animation system (FR9, FR10):**
10. Global easing CSS variable: `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`
11. Dropdown: fade + slide down 250ms
12. Modal: fade + scale 0.9→1 250ms
13. Skeleton: shimmer sweep 1500ms infinite
14. Toast (sonner): slide in from bottom 250ms
15. Settings FAB: rotate 360° on hover 1000ms linear
16. All animations disabled when `prefers-reduced-motion: reduce`

## Tasks / Subtasks

- [x] Task 1: Update Badge component (AC: 1-4)
  - [x] Height: add `h-[24px]` (or `min-h-[24px]`) and `items-center`
  - [x] Radius: `rounded-[16px]`
  - [x] Font: `text-xs font-semibold` (12px, 600)
  - [x] Padding: `px-2.5`
  - [x] Tinted style pattern per variant:
    - `success`: `bg-success/10 text-success border border-success/30`
    - `warning`: `bg-warning/10 text-warning border border-warning/30`
    - `error`/`destructive`: `bg-error/10 text-error border border-error/30`
    - `info`: `bg-info/10 text-info border border-info/30`
    - `default`: `bg-primary/10 text-primary border border-primary/30`
  - [x] Verify `success`, `warning`, `error`, `info` color tokens exist in tailwind config (from Story 2.1)
  - [x] Current badge has `info: bg-primary/10` — update all variants to tinted pattern

- [x] Task 2: Update Table styles (AC: 5-9)
  - [x] Check if `src/components/ui/table.tsx` exists; if so update styles
  - [x] Table header cells: `text-xs font-medium` (12px, 500)
  - [x] Table body cells: `text-xs font-normal` (12px, 400)
  - [x] Row border: `border-b border-border` on `<tr>`
  - [x] Ensure table is always wrapped in a Card (document this convention, don't enforce in component)
  - [x] Dark mode: `border-border` auto-handles via CSS variable

- [x] Task 3: Add animation CSS variables (AC: 10)
  - [x] Add to globals.css `:root`:
    ```css
    --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
    --duration-fast: 100ms;
    --duration-normal: 250ms;
    --duration-slow: 1000ms;
    ```

- [x] Task 4: Dropdown animation (AC: 11)
  - [x] In `src/components/ui/select.tsx` or relevant dropdown:
    ```css
    @keyframes dropdown-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    ```
  - [x] Apply: `animate-[dropdown-in_250ms_var(--ease-standard)]`
  - [x] Add keyframe to globals.css

- [x] Task 5: Modal/Dialog animation (AC: 12)
  - [x] In `src/components/ui/dialog.tsx`:
    - Overlay: fade in `opacity-0 → opacity-100` 250ms
    - Content: `scale-[0.9] opacity-0 → scale-100 opacity-100` 250ms
  - [x] In `src/components/ui/sheet.tsx`:
    - Slide in from edge 250ms (already may have this)

- [x] Task 6: Skeleton shimmer (AC: 13)
  - [x] In `src/components/ui/skeleton.tsx`:
    ```css
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    ```
    ```css
    background: linear-gradient(90deg, var(--muted)/20 25%, var(--muted)/40 50%, var(--muted)/20 75%);
    background-size: 200% 100%;
    animation: shimmer 1500ms infinite linear;
    ```
  - [x] `border-radius` on skeleton should match the parent element's shape

- [x] Task 7: Verify reduced-motion disables all (AC: 16)
  - [x] Story 2.1 adds the global `prefers-reduced-motion` rule — verify it covers all these animations
  - [x] Test with DevTools: Rendering > Emulate CSS media feature `prefers-reduced-motion: reduce`

## Dev Notes

### Current Badge State

```
px-2.5 py-0.5
motion-reduce:transition-none
info: "bg-primary/10"
bg-destructive/10
```
Badge already has `bg-{variant}/10` pattern partially. Needs: height 24px, radius 16px, font 12px/600, border on each variant, explicit success/warning/error/info variants.

### Animation Keyframes in globals.css

Add all keyframes to `src/app/globals.css` rather than inline Tailwind to keep animation definitions in one place. Reference via `animate-[name_duration_easing]` in Tailwind or via class names.

### Tailwind Arbitrary Animation

For custom keyframes, use either:
1. `tailwind.config.js` `theme.extend.keyframes` and `theme.extend.animation`
2. CSS `@keyframes` in globals.css + `animation` property directly

Method 1 is cleaner for reuse. Add to tailwind config:
```js
keyframes: {
  shimmer: { '0%, 100%': { backgroundPosition: '-200% 0' }, '50%': { backgroundPosition: '200% 0' } },
  'dropdown-in': { from: { opacity: '0', transform: 'translateY(-4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  'modal-in': { from: { opacity: '0', transform: 'scale(0.9)' }, to: { opacity: '1', transform: 'scale(1)' } },
},
animation: {
  shimmer: 'shimmer 1500ms linear infinite',
  'dropdown-in': 'dropdown-in 250ms cubic-bezier(0.4,0,0.2,1)',
  'modal-in': 'modal-in 250ms cubic-bezier(0.4,0,0.2,1)',
}
```

### Settings FAB Animation

The Settings FAB (floating action button) rotates 360° on hover. This is likely in a settings page or layout component. Note for implementation: `hover:rotate-[360deg] transition-transform duration-1000 ease-linear`.

### Token Dependencies (Story 2.1 Required)

- `success`, `warning`, `error`, `info` tokens in tailwind config
- `--ease-standard` CSS variable
- `--border` CSS variable for table row separators

### Project Structure Notes

- Badge: `src/components/ui/badge.tsx`
- Table: `src/components/ui/table.tsx` (check if exists; may need to create table styles)
- Dialog: `src/components/ui/dialog.tsx`
- Sheet: `src/components/ui/sheet.tsx`
- Select: `src/components/ui/select.tsx`
- Skeleton: `src/components/ui/skeleton.tsx`
- All keyframes → `src/app/globals.css` or `tailwind.config.js`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5]
- [Source: _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md#FR6-FR7-FR9-FR10]
- [Source: CLAUDE.md#Design-Tokens]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- Badge: Updated to `min-h-[24px]`, `rounded-[16px]`, `text-xs font-semibold` with tinted-border pattern for all semantic variants (success/warning/error/info/default). Added `error` variant alias for destructive. Added `error` color token to tailwind.config.ts.
- Table: Header cells `text-[12px] font-medium`, body cells `text-xs font-normal`, row border `border-b border-border`. Both TableHeader and TableRow/TableCell updated.
- Animation CSS vars: Added `--ease-standard`, `--duration-fast/normal/slow` to globals.css `:root`.
- Added `shimmer`, `dropdown-in`, `modal-in` keyframes + animation utilities to tailwind.config.ts.
- Dialog: Content uses `data-[state=open]:animate-modal-in` with `motion-reduce` disable. Radius updated to `rounded-[24px]`.
- Skeleton: Replaced `animate-pulse` with `animate-shimmer` + gradient shimmer background.
- Select: Dropdown content uses `data-[state=open]:animate-dropdown-in` with `motion-reduce` disable.
- Zero new TypeScript errors introduced (2 pre-existing in layout.tsx unrelated).

### File List

- src/components/ui/badge.tsx
- src/components/ui/table.tsx
- src/components/ui/dialog.tsx
- src/components/ui/skeleton.tsx
- src/components/ui/select.tsx
- tailwind.config.ts
- src/app/globals.css
