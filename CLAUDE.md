# CLAUDE.md — GrowBase Dev Context
# Token-optimized.

## Project
GrowBase — family finance web app (Next.js 14 + Supabase + TypeScript)

## Monorepo
pnpm workspace: `apps/web` (Next.js) · `apps/mobile` (Expo SDK 56, thin client — data only via web `/api`) · `packages/shared` (`@growbase/shared`: types, Zod schemas, rules, query keys — consumed as source)
- Run mobile: `pnpm --filter @growbase/mobile start` (scripts dùng `--dev-client`; cần dev build, không phải Expo Go)
- Root `.pnpmfile.cjs` injects optional `@types/react` peer → mỗi app link đúng React types major (web 18, mobile 19). Package types-only mới dùng React types mà không peer `react` → thêm vào `EXTRA_PACKAGES`/`EXTRA_PREFIXES` trong file đó
- react-native-mmkv: import runtime OK — app chạy qua dev client (`expo-dev-client`) từ Epic 15.1 (MMKV lưu blob session mã hóa)

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

**Before writing any TypeScript/SQL/React code (inside `bmad-dev-story` or standalone), always apply the `karpathy-guidelines` skill first.** Do not rely on its auto-trigger alone — invoke it explicitly. This is a hard gate, not optional.

## Stack
Next.js 14 App Router · TypeScript · Tailwind · shadcn/ui (Spike Admin blue theme) · Supabase · TanStack Query v5 · Zustand · ApexCharts · React Hook Form · Zod · sonner

## Design Tokens

- Brand Primary: `#0084DB` · Hover: `#006BB8` · Pressed: `#004F8A` · Tint: `#EBF5FF` · Dark BG: `#05101A`
- Semantic: success `#49d68d` · warning `#ffbd6f` · error `#ff917d` · info `#49c8e6` · violet `#9b78ff`
- Background: cool blue-gray `#eef5fb` — cards white, creates depth
- Text: ink `#1d2737` (headings) · text `#2a3445` (body) · muted `#7d8b9f` · faint `#a5b1c2`
- Borders: `#e5edf6` — light blue-gray
- Shadows: `shadow-card` = `rgba(37,83,185,0.1) 0 2px 6px` · `shadow-sidebar` = none · `shadow-float` = `rgba(0,133,219,0.26) 0 8px 18px`
- Fonts: Plus Jakarta Sans (body) + JetBrains Mono (amounts)
- Theme: Light default, Dark toggle via `next-themes`. No hardcoded colors
- Surfaces: `bg-background` → `bg-card` → `bg-elevated` (semantic tokens)
- Amounts: always `font-mono` with tabular-nums
- Cards: data `rounded-[13px] border border-border/40 bg-card shadow-card` · stat/metric `rounded-[18px]`
- Buttons: `rounded-full` pill shape, `hover:brightness-[0.8]`
- Inputs: `h-[44px] rounded-[18px] border border-border`, focus `ring-2 ring-primary/20`
- Nav: Left drawer (desktop ≥ 1024px, `w-[272px]` flush fixed, CSS notch active) + Bottom nav (mobile)
- Sidebar: bg-card flush (no rounding), grouped nav sections, active pill extends to right edge (CSS `sidebar-nav-link[data-active]`), user card bottom `rounded-2xl bg-primary-soft`
- Topbar: flat `bg-card shadow-soft-xs` mobile · `lg:border-b header-custom` desktop (CSS notch decorator on left)
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
