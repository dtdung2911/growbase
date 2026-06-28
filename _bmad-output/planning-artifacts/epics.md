---
stepsCompleted: [step-01, step-02, step-03, step-04]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md
---

# GrowBase - Epic Breakdown

## Overview

Tài liệu này breakdown toàn bộ epics và stories cho GrowBase, dựa trên PRD "Chuẩn Hóa UI & Xác Nhận Luồng Nghiệp Vụ" và Architecture Spine, thành các stories có thể implement được.

## Requirements Inventory

### Functional Requirements

**G1: UI Standardization**

FR1: Update tất cả screens/components theo design tokens Spike Admin (primary `#0085DB`, bg `#F0F5F9`, card `#FFFFFF`, text `#111C2D`/`#707A82`, border `#DFE5EF`)
FR2: Xóa hết hard-coded colors — tất cả qua CSS variables/Tailwind tokens (zero exceptions)
FR3: Chuẩn hóa Card component — standard `border-radius: 13px` + `box-shadow: rgba(37,83,185,0.1) 0px 2px 6px`; stat card `18px`; `CardContent padding: 30px 30px 24px`
FR4: Chuẩn hóa Button component — height 44px (md)/30px (sm)/56px (lg); `border-radius: 25px` (pill); hover darken 20%, active darken 40%, disabled `rgba(0,0,0,0.12)`
FR5: Chuẩn hóa Input/Form component — height `44px`; `border-radius: 18px`; border `1px solid #DFE5EF`; focus border `#0085DB`; error border `#FB977D` + text 12px bên dưới; floating label
FR6: Chuẩn hóa Badge component — height `24px`; `border-radius: 16px`; `font: 12px weight 600`; tinted background style (background nhạt + border + text đậm)
FR7: Chuẩn hóa Table — trong Card 13px radius; header `12px weight 500`; body `12px weight 400`; row border `1px solid #E5EAEF`
FR8: Thêm Page Header Banner mỗi trang — bg `#FFFFFF`, `border-radius: 13px`, `padding: 20px 24px`; title `22px weight 700` (trái) + Breadcrumb (phải)
FR9: Implement animation & transitions đúng spec — easing `cubic-bezier(0.4, 0, 0.2, 1)`; button hover 250ms, input focus 250ms, dropdown 250ms, modal 250ms, skeleton 1500ms infinite
FR10: Implement `prefers-reduced-motion` — tắt tất cả animation khi enabled; không dùng `transition: all`
FR11: Implement Dark mode hoàn chỉnh — floating toggle bottom-right + Settings > Appearance; tất cả color tokens có dark variant; dùng `next-themes` + CSS variables
FR12: Tất cả screens pass 10-point checklist (no hard-coded color, card radius/shadow, button height/radius/states, input height/radius/states, badge semantic/tinted, Plus Jakarta Sans, 8px spacing, page header banner, animation spec, dark mode)

**G2: Architecture Fixes (từ Architecture Spine AD-1 bug)**

FR13: Fix `/api/household` và `/api/households` routes — thay manual auth bằng `withAuth()` từ `@/lib/supabase/auth-check`; chuẩn hóa response shape thành `{ data: T | null, error: string | null }`
FR14: Thêm household membership double guard (AD-6) cho tất cả routes chưa có — verify `user.id` trong `household_members` sau `withAuth()` trước khi access data

### NonFunctional Requirements

NFR1: Primary breakpoint 375px (1 cột) — không break mobile layout sau UI update
NFR2: Touch targets min `44×44px` trên tất cả interactive elements
NFR3: Input font-size `16px` (tránh iOS zoom)
NFR4: Pages có bottom nav: `padding-bottom: 64px`
NFR5: Skeleton loading cho lists và charts — không spinner toàn trang
NFR6: Lazy load ApexCharts khi tab active (không load chart ngoài viewport)
NFR7: TanStack Query stale-time phù hợp per query (không để mặc định cho tất cả)
NFR8: WCAG AA contrast — 4.5:1 (text thường) · 3:1 (large text ≥18px/bold ≥14px)
NFR9: `aria-label` cho tất cả icon-only buttons
NFR10: Keyboard navigation đầy đủ (Tab order logic, focus visible)
NFR11: Tất cả strings qua `t()` từ `useTranslation()` — không hard-code tiếng Việt hay tiếng Anh trong components
NFR12: Số tiền format theo currency của household
NFR13: Ngày: `DD/MM/YYYY` (vi) · `MM/DD/YYYY` (en)
NFR14: Mọi API route gọi `withAuth()` đầu tiên → 401 nếu không có session
NFR15: RLS enforced tại DB level (user client cho user ops)
NFR16: Response shape chuẩn: `{ data: T | null, error: string | null }` trong mọi API route

### Additional Requirements

Từ Architecture Spine:

- AR1: Không có starter template mới — project đã có codebase (S0→S4 + REDESIGN + FUND_MGMT đã implement)
- AR2: `page.tsx` = thin wrapper → `<FeatureClient />`. Logic, state, queries trong `FeatureClient.tsx` (`"use client"`)
- AR3: Tất cả TanStack Query keys qua `keys.*` factory từ `@/lib/queries/queryKeys` — không hardcode key arrays
- AR4: `householdId` từ Zustand store only — không từ URL params hoặc request body trực tiếp
- AR5: Household switching state: `householdId` update → `currentMonth` reset → cache invalidate (AD-3)
- AR6: API routes = Node.js runtime. Middleware = Edge runtime — `supabaseAdmin` forbidden trong middleware (AD-5)
- AR7: Open Question OQ-1 cần resolve trước khi write RLS policies: verify `households` table RLS status với anon key
- AR8: RLS policies cho transactions/funds/accounts/budget/categories — deferred đến hybrid migration sprint (D-1)

### UX Design Requirements

Không có UX Design document riêng. UX requirements đã được tích hợp vào PRD section 5 (UX/Design Requirements) và đã extract thành FR1-FR12 ở trên.

### FR Coverage Map

| FR | Epic | Scope |
|----|------|-------|
| FR1 | Epic 2 | Design tokens → globals.css + tailwind.config |
| FR2 | Epic 2 | Remove hard-coded colors → globals.css |
| FR3 | Epic 2 | Card component → ui/card.tsx |
| FR4 | Epic 2 | Button component → ui/button.tsx |
| FR5 | Epic 2 | Input component → ui/input.tsx |
| FR6 | Epic 2 | Badge component → ui/badge.tsx |
| FR7 | Epic 2 | Table component → ui/table.tsx |
| FR8 | Epic 3 | Page Header Banner → all feature pages |
| FR9 | Epic 2 | Animations → globals.css + components |
| FR10 | Epic 2 | prefers-reduced-motion → globals.css |
| FR11 | Epic 3 | Dark mode → next-themes + all tokens |
| FR12 | Epic 3 | Per-screen checklist pass → all screens |
| FR13 | Epic 1 | Fix /api/household + /api/households |
| FR14 | Epic 1 | Membership double guard for routes missing it |

## Epic List

---

## Epic 1: API Security Hardening

**Goal:** Mọi API route enforce auth đúng chuẩn — withAuth() first, membership guard, response shape chuẩn — không còn lỗ hổng auth trong codebase.

**FRs:** FR13, FR14 | **NFRs:** NFR14, NFR15, NFR16

---

### Story 1.1: Standardize Auth on Household API Routes

```
As a developer maintaining the codebase,
I want /api/household and /api/households to use withAuth() and standard response shape,
So that auth enforcement is consistent and secure across all API routes.
```

**Acceptance Criteria:**

- **Given** `/api/household/route.ts` currently uses manual auth
  **When** the fix is applied
  **Then** first call in every handler is `withAuth()` from `@/lib/supabase/auth-check`
- **And** unauthenticated requests return 401 with `{ data: null, error: "Unauthorized" }`
- **And** all success responses return `{ data: T, error: null }`
- **And** all error responses return `{ data: null, error: string }`
- **And** same fix applied to all handlers in `/api/households/route.ts`
- **And** no `export const runtime = "edge"` in either file (Node.js runtime)

---

### Story 1.2: Add Household Membership Double Guard to API Routes

```
As a household member,
I want the API to verify I belong to a household before it serves me that household's data,
So that I cannot access another household's data by spoofing a householdId.
```

**Acceptance Criteria:**

- **Given** a request to any route that accepts a `householdId` parameter
  **When** `withAuth()` succeeds
  **Then** route explicitly queries `household_members` to verify `user.id` is an active member of that `householdId`
- **And** if membership check fails → return 403 `{ data: null, error: "Forbidden" }`
- **And** only after both checks pass → execute the actual data operation
- **And** this guard present on: `/api/household`, `/api/households`, and any other route touching household-scoped data

---

## Epic 2: Design System Foundation

**Goal:** Người dùng tương tác với UI có components đẹp, nhất quán — buttons, cards, inputs, badges, tables, animations đều đúng Spike Admin spec.

**FRs:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR9, FR10 | **NFRs:** NFR2, NFR3, NFR8, NFR9

---

### Story 2.1: Implement Design Token System & Global CSS

```
As a user,
I want all colors, typography and spacing to be consistent across the app,
So that the visual identity feels cohesive and professional.
```

**Acceptance Criteria:**

- **Given** the design token spec (primary `#0085DB`, bg `#F0F5F9`, card `#FFFFFF`, text `#111C2D`/`#707A82`, border `#DFE5EF`, success/warning/error/info)
  **When** globals.css and tailwind.config.js are updated
  **Then** all tokens are declared as CSS variables under `:root` and `.dark`
- **And** Tailwind config maps all tokens to semantic names (primary, background, card, muted, border, etc.)
- **And** zero hard-coded hex colors remain in any component file
- **And** font `Plus Jakarta Sans` applied globally; `JetBrains Mono` for amount displays
- **And** 8px spacing scale base configured
- **And** `prefers-reduced-motion` global rule: all transitions/animations disabled when enabled
- **And** `transition: all` not used anywhere in codebase

---

### Story 2.2: Standardize Card Component

```
As a user,
I want information cards to have consistent rounded corners and subtle shadows,
So that the UI feels modern and visually structured.
```

**Acceptance Criteria:**

- **Given** `src/components/ui/card.tsx`
  **When** updated to match spec
  **Then** standard card: `border-radius: 13px` + `box-shadow: rgba(37,83,185,0.1) 0px 2px 6px`
- **And** stat card variant: `border-radius: 18px`
- **And** `CardContent` padding: `30px 30px 24px`
- **And** card background uses `bg-card` token (not hardcoded `#FFFFFF`)
- **And** card renders correctly in both light and dark mode

---

### Story 2.3: Standardize Button Component

```
As a user,
I want buttons to be consistently sized with clear hover and active states,
So that the UI feels interactive and responsive to my actions.
```

**Acceptance Criteria:**

- **Given** `src/components/ui/button.tsx`
  **When** updated to match spec
  **Then** heights: `44px` (md/default) · `30px` (sm) · `56px` (lg)
- **And** `border-radius: 25px` (pill shape) on all variants
- **And** hover state: darken background 20% with 250ms transition
- **And** active/press state: darken background 40% with 100ms transition
- **And** disabled state: `rgba(0,0,0,0.12)` background
- **And** min touch target `44×44px` on all interactive states (NFR2)
- **And** all states work in dark mode

---

### Story 2.4: Standardize Input & Form Component

```
As a user,
I want form inputs to have clear focus states and helpful error messages,
So that I know what I'm editing and what went wrong.
```

**Acceptance Criteria:**

- **Given** `src/components/ui/input.tsx`
  **When** updated to match spec
  **Then** height: `44px`; `border-radius: 18px`; border: `1px solid var(--border)` (`#DFE5EF`)
- **And** focus state: border changes to `var(--primary)` (`#0085DB`) with 250ms transition
- **And** error state: border changes to `var(--error)` (`#FB977D`) + error text `12px` below field
- **And** floating label above field when focused or has value
- **And** font-size: `16px` (prevents iOS zoom — NFR3)
- **And** all states work in dark mode

---

### Story 2.5: Standardize Badge, Table & Animation System

```
As a user,
I want status badges and data tables to be visually distinct, and UI transitions to feel smooth,
So that I can quickly scan data and experience a polished interface.
```

**Acceptance Criteria:**

**Badge (`src/components/ui/badge.tsx`):**
- Height: `24px`; `border-radius: 16px`; `font-size: 12px; font-weight: 600`
- Tinted style: light background + matching border + darker text (not solid fill)
- Semantic variants: success (green tint), warning (orange tint), error (red tint), info (blue tint), default
- All variants work in dark mode

**Table (shared table styles):**
- Always rendered inside a card with `border-radius: 13px`
- Header: `font-size: 12px; font-weight: 500`
- Body rows: `font-size: 12px; font-weight: 400`
- Row separator: `border-bottom: 1px solid var(--border)`
- Works in dark mode

**Animation system (FR9, FR10):**
- Global easing: `cubic-bezier(0.4, 0, 0.2, 1)` defined as CSS variable
- Dropdown: fade + slide down 250ms; Modal: fade + scale 0.9→1 250ms
- Skeleton: shimmer sweep 1500ms infinite; Toast: slide in bottom 250ms
- Settings FAB: rotate 360° on hover 1000ms linear
- All disabled when `prefers-reduced-motion: reduce`

---

## Epic 3: Full App UI Standardization

**Goal:** Người dùng trải nghiệm toàn bộ app nhất quán — dark mode hoạt động, mỗi trang có page header, performance tốt, i18n đúng, tất cả screens pass 10-point checklist.

**FRs:** FR8, FR11, FR12 | **NFRs:** NFR1, NFR4, NFR5, NFR6, NFR7, NFR10, NFR11, NFR12, NFR13

**Dependency:** Requires Epic 2 complete — component primitives must exist before screen rollout.

---

### Story 3.1: Implement Dark Mode System

```
As a user,
I want to switch the app to dark mode and have it remembered across sessions,
So that I can use the app comfortably in low-light environments.
```

**Acceptance Criteria:**

- **Given** `next-themes` is installed
  **When** user clicks floating ThemeToggle (bottom-right)
  **Then** app switches between light and dark mode; preference persisted in localStorage
- **And** floating ThemeToggle rendered on all `(app)` pages
- **And** Settings > Appearance page has theme toggle as well
- **And** all CSS token variables have `.dark` variants (no hardcoded colors in dark mode)
- **And** dark mode applies to: sidebar, topbar, cards, buttons, inputs, badges, tables, modals, sheets
- **And** no flash of wrong theme on page load (SSR-safe with `next-themes`)

---

### Story 3.2: Add Page Header Banner to All Feature Pages

```
As a user,
I want each page to have a clear header with title and breadcrumb,
So that I always know where I am in the app.
```

**Acceptance Criteria:**

- **Given** any feature page (Dashboard, Transactions, Budget, Funds, Reports, Settings, etc.)
  **When** the page loads
  **Then** page header banner rendered: `bg-card` token, `border-radius: 13px`, `padding: 20px 24px`
- **And** title: `22px font-weight 700` aligned left; breadcrumb aligned right
- **And** page header banner uses `bg-card` token (works in dark mode)
- **And** Sidebar (270px) + Navbar (64px) NOT changed — already standardized
- **And** all feature pages covered: Dashboard, Transactions, Import, Budget, Funds, Reports, Investments, Debt, Scheduled Payments, Net Worth, Settings sub-pages

---

### Story 3.3: Standardize Dashboard & Shared Component Screens

```
As a user,
I want the Dashboard and shared components to reflect the updated design system,
So that the main screen I see every day looks polished and consistent.
```

**Acceptance Criteria:**

- **Given** DashboardClient, FundOverviewCard, RecentTransactionsList, MetricCard, BudgetProgressBar, DueBadge
  **When** each component is updated
  **Then** all pass 11-point checklist: (1) no hard-coded colors (2) card radius/shadow correct (3) button height/pill/states (4) input height/radius/states (5) badges semantic+tinted (6) Plus Jakarta Sans + JetBrains Mono for amounts (7) 8px spacing (8) page header banner in place (9) animation per spec + prefers-reduced-motion (10) dark mode works (11) aria-label on all icon-only buttons (NFR9)
- **And** MetricCard uses stat card variant (border-radius 18px)
- **And** DueBadge: ≤7 days → error tint, 8-30 → warning tint, >30 → no badge
- **And** Dashboard skeleton loading per section (no full-page spinner — NFR5)
- **And** `padding-bottom: 64px` on mobile with bottom nav (NFR4)

---

### Story 3.4: Standardize Transaction & Budget Screens

```
As a user,
I want the transaction list and budget tracker to look polished and responsive,
So that I can manage daily finances in a visually consistent interface.
```

**Acceptance Criteria:**

- **Given** TransactionList, TransactionForm, ImportClient, BudgetClient, BudgetGroupRow, BudgetOverrideInput, CurrencyInput
  **When** each component is updated
  **Then** all pass 11-point checklist: (1) no hard-coded colors (2) card radius/shadow correct (3) button height/pill/states (4) input height/radius/states (5) badges semantic+tinted (6) Plus Jakarta Sans + JetBrains Mono for amounts (7) 8px spacing (8) page header banner in place (9) animation per spec + prefers-reduced-motion (10) dark mode works (11) aria-label on all icon-only buttons (NFR9)
- **And** TransactionList: skeleton loading while fetching (NFR5); table within card 13px radius
- **And** BudgetProgressBar: semantic colors (success/warning/error tints per spend level)
- **And** CurrencyInput: `font-family: JetBrains Mono`, `font-variant-numeric: tabular-nums`
- **And** amounts formatted per household currency (NFR12)
- **And** all strings via `t()` — no hardcoded Vietnamese or English text (NFR11)
- **And** WCAG AA contrast maintained on all text (NFR8)

---

### Story 3.5: Standardize Fund, Investment & Modal/Sheet Components

```
As a user,
I want fund cards, investment holdings and modal dialogs to look polished,
So that every interaction in the app feels consistent with the design system.
```

**Acceptance Criteria:**

- **Given** FundList, WithdrawModal, HoldingForm, alert-dialog, dialog, sheet, select, skeleton
  **When** each component is updated
  **Then** all pass 11-point checklist: (1) no hard-coded colors (2) card radius/shadow correct (3) button height/pill/states (4) input height/radius/states (5) badges semantic+tinted (6) Plus Jakarta Sans + JetBrains Mono for amounts (7) 8px spacing (8) page header banner in place (9) animation per spec + prefers-reduced-motion (10) dark mode works (11) aria-label on all icon-only buttons (NFR9)
- **And** Modals: fade + scale 0.9→1 250ms open animation; disabled when prefers-reduced-motion
- **And** Sheets: slide in from edge 250ms; disabled when prefers-reduced-motion
- **And** Select dropdown: fade + slide down 250ms
- **And** Skeleton: shimmer 1500ms infinite; border-radius matches parent card
- **And** FundList: skeleton loading per fund card (not spinner — NFR5)
- **And** ApexCharts on fund/investment screens: lazy loaded when tab active (NFR6)

---

### Story 3.6: Standardize Onboarding, Login & Layout Components

```
As a new user going through onboarding or logging in,
I want the onboarding wizard and login page to match the updated design system,
So that first impressions are polished and consistent with the rest of the app.
```

**Acceptance Criteria:**

- **Given** WizardLayout, WizardStep1Type, WizardStep6Categories, LoginClient, TopHeader, Logo
  **When** each component is updated
  **Then** all pass 11-point checklist: (1) no hard-coded colors (2) card radius/shadow correct (3) button height/pill/states (4) input height/radius/states (5) badges semantic+tinted (6) Plus Jakarta Sans + JetBrains Mono for amounts (7) 8px spacing (8) page header banner in place (9) animation per spec + prefers-reduced-motion (10) dark mode works (11) aria-label on all icon-only buttons (NFR9)
- **And** Login page: all strings i18n via `t()` including error messages (NFR11)
- **And** Onboarding wizard: progress bar uses semantic colors; step buttons 44px height (NFR2)
- **And** TopHeader: float style on desktop (rounded-2xl, border, shadow); month nav + notification bell + user pill
- **And** Logo renders correctly in light and dark mode
- **And** Keyboard navigation: Tab order logical through wizard steps (NFR10)
- **And** Dates displayed per locale: `DD/MM/YYYY` (vi) / `MM/DD/YYYY` (en) (NFR13)
- **And** TanStack Query stale-time configured per query type (not global default — NFR7)
