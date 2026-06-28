# CLAUDE.md — GrowBase Dev Context
# Token-optimized.

## Project
GrowBase — family finance web app (Next.js 14 + Supabase + TypeScript)

## Docs
| File | Read when |
|------|-----------|
| `docs/01_BUSINESS_CONTEXT.md` | Need domain/object/flow understanding |
| `docs/02_BUSINESS_RULES.md` | Writing validation, triggers, constraints |
| `docs/03_PRODUCT_BACKLOG.md` | Picking sprint tasks, reading ACs |
| `docs/04_TECHNICAL_SPEC.md` | Schema SQL, API spec, DB functions, seed |
| `docs/05_UX_SPEC.md` | Building UI — screens, components, UX rules |
| `docs/06_STYLE_GUIDE.md` | Visual identity — colors, typography, spacing, component patterns |

## Workflow
Use **BMad Method** for all feature work:
- `bmad-prd` → PRD creation
- `bmad-create-epics-and-stories` → Epic/Story breakdown
- `bmad-dev-story` → Dev story for implementation
- `bmad-code-review` → Code review

## Stack
Next.js 14 App Router · TypeScript · Tailwind · shadcn/ui (Spike Admin blue theme) · Supabase · TanStack Query v5 · Zustand · ApexCharts · React Hook Form · Zod · sonner

## Design Tokens

- Brand Primary: `#0084DB` · Hover: `#006BB8` · Pressed: `#004F8A` · Tint: `#EBF5FF` · Dark BG: `#05101A`
- Semantic: success `#49d68d` · warning `#ffbd6f` · error `#ff917d` · info `#49c8e6` · violet `#9b78ff`
- Background: cool blue-gray `#eef5fb` — cards white, creates depth
- Text: ink `#1d2737` (headings) · text `#2a3445` (body) · muted `#7d8b9f` · faint `#a5b1c2`
- Borders: `#e5edf6` — light blue-gray
- Shadows: blue-tinted `rgba(29, 77, 124, 0.08)` — not black-based
- Fonts: Plus Jakarta Sans (body) + JetBrains Mono (amounts)
- Theme: Light default, Dark toggle via `next-themes`. No hardcoded colors
- Surfaces: `bg-background` → `bg-card` → `bg-elevated` (semantic tokens)
- Amounts: always `font-mono` with tabular-nums
- Cards: `rounded-2xl border border-border/40 shadow-card` — 18px radius, border + shadow
- Buttons: `rounded-full` pill shape, hover elevation (`-translate-y-px`)
- Inputs: 48px height, focus glow (`ring-primary/20`)
- Nav: Left drawer (desktop ≥ 1024px, 272px wide, rounded-3xl float, notch active state) + Bottom nav (mobile)
- Sidebar: grouped nav sections, user profile card at bottom, active = extends to right edge with curved corner cutouts
- Topbar: float style on desktop (rounded-2xl, border, shadow), month nav left + notification bell + user pill right
- i18n: vi (default) + en. All strings via `t()` function, no hardcode. Login page fully i18n-ized
- Theme: light default, dark toggle. Floating ThemeToggle (bottom-right) on all pages. Also in Settings > Appearance
- Language: switchable vi/en. Floating toggle (bottom-right) on all pages. Also in Settings > Appearance

## Non-Negotiable Rules
1. Fund ops = atomic RPC only
2. behavior_type = DB trigger, readonly in UI
3. is_system=true = immutable
4. Auth check first in every API route
5. Keys from keys.ts factory

## Zustand Store
```typescript
{ householdId: string|null, currentMonth: string, user: User|null }
```

## Query Key Factory
```typescript
keys.transactions(hid, month) // always use factory, never hardcode
```

## Error Patterns
- Lists: skeleton loading, not spinner
- Mutations: isPending → disabled button
- Success: toast.success 2s
- Error: keep form + toast.error 5s
- Destructive: ConfirmDialog first

## Mobile
375px primary · 44px touch targets · 16px input font · pb-16 for nav pages
