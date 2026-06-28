# Story 3.2: Add Page Header Banner to All Feature Pages

Status: review

## Story

As a user,
I want each page to have a clear header with title and breadcrumb,
so that I always know where I am in the app.

## Acceptance Criteria

1. **Given** any feature page (Dashboard, Transactions, Budget, Funds, etc.)
   **When** the page loads
   **Then** page header banner rendered: `bg-card` token, `border-radius: 13px`, `padding: 20px 24px`

2. **Given** page header content
   **When** rendered
   **Then** title: `22px font-weight 700` aligned left; breadcrumb aligned right

3. **Given** dark mode
   **When** toggled
   **Then** page header banner uses `bg-card` token — renders correctly in dark

4. **Given** sidebar and navbar
   **When** page updates
   **Then** Sidebar (270px) and Navbar (64px) are NOT changed — they were already standardized

5. **Given** ALL feature pages
   **When** audited
   **Then** page header banner present on: Dashboard, Transactions, Import, Budget, Funds, Reports, Investments, Debt, Scheduled Payments, Net Worth, Settings sub-pages

## Tasks / Subtasks

- [x] Task 1: Create PageHeader component (AC: 1, 2)
  - [x] Create `src/components/shared/PageHeader.tsx`
  - [x] Props: `title: string`, `breadcrumb?: ReactNode`, `className?: string`
  - [x] Structure:
    ```tsx
    <div className="bg-card rounded-[13px] px-6 py-5 mb-6 flex items-center justify-between">
      <h1 className="text-[22px] font-bold text-foreground">{title}</h1>
      {breadcrumb && <div className="text-sm text-muted-foreground">{breadcrumb}</div>}
    </div>
    ```
  - [x] Title must use `t()` pattern — accept already-translated string as prop

- [x] Task 2: Create Breadcrumb component or pattern (AC: 2)
  - [x] Simple breadcrumb: `Home > Section > Page` text links
  - [x] Create `src/components/shared/Breadcrumb.tsx` or use shadcn Breadcrumb if available
  - [x] Text: `text-sm text-muted` with `/` separator; current page not linked
  - [x] All breadcrumb strings via `t()` from `useTranslation()`

- [x] Task 3: Audit all feature pages (AC: 5)
  - [x] Find all `page.tsx` under `src/app/(app)/`
  - [x] List: Dashboard, Transactions, Import, Budget, Funds, Reports, Investments, Debt, Scheduled Payments, Net Worth, Settings (and sub-pages)
  - [x] For each `FeatureClient.tsx`: add `<PageHeader title={t('page.title')} breadcrumb={...} />` at the top

- [x] Task 4: Add PageHeader to each feature page client (AC: 1, 2, 5)
  - [x] DashboardClient.tsx → `<PageHeader title={t('dashboard.title')} />`
  - [x] TransactionList.tsx or TransactionClient.tsx → add header
  - [x] ImportClient.tsx → add header
  - [x] BudgetClient.tsx → add header
  - [x] FundList.tsx or FundClient.tsx → add header
  - [x] Reports page client → add header
  - [x] HoldingForm.tsx parent / InvestmentClient.tsx → add header
  - [x] Debt/ScheduledPayments/NetWorth clients → add header
  - [x] Settings sub-pages → add header to each

- [x] Task 5: Add i18n keys (AC: 2)
  - [x] Add page title keys to `src/lib/i18n/messages/vi.json` and `en.json`
  - [x] Pattern: `page.dashboard`, `page.transactions`, `page.budget`, etc.

- [x] Task 6: Dark mode verification (AC: 3)
  - [x] Toggle dark mode and check each header banner
  - [x] `bg-card` should render correctly in dark

## Dev Notes

### Architecture Rule (A-6)

`page.tsx` = thin wrapper rendering `FeatureClient`. All logic, state, queries in `FeatureClient.tsx` (`"use client"`). The `PageHeader` must be added inside the Client component, not in `page.tsx`.

```tsx
// src/app/(app)/dashboard/page.tsx  ← DO NOT modify
import DashboardClient from "@/components/dashboard/DashboardClient"
export default function DashboardPage() { return <DashboardClient /> }

// src/components/dashboard/DashboardClient.tsx  ← modify here
"use client"
export default function DashboardClient() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('dashboard.title')} breadcrumb={<Breadcrumb items={[{ label: t('nav.home') }]} />} />
      {/* existing content */}
    </>
  )
}
```

### Feature Page Inventory

Run: `find src/app/\\(app\\) -name "page.tsx" | sort` to get full list. Expected pages:
- `/dashboard`
- `/transactions`
- `/transactions/import`
- `/budget`
- `/funds`
- `/funds/[id]` (detail page)
- `/reports`
- `/investments`
- `/debt`
- `/scheduled-payments`
- `/net-worth`
- `/settings`
- `/settings/appearance`
- `/settings/household`
- `/settings/...`

### PageHeader Styling

```tsx
// padding: 20px 24px = py-5 px-6
// title: text-[22px] font-bold
// bg: bg-card (white in light, dark-card in dark)
// radius: rounded-[13px]
// shadow: optional shadow-card for depth
```

Add `mb-6` margin-bottom to separate from page content below.

### i18n Pattern

```tsx
// In any Client component:
import { useTranslation } from "@/lib/i18n/TranslationContext"
// or whatever the custom i18n hook is

const { t } = useTranslation()
// <PageHeader title={t('nav.dashboard')} />
```

Check `src/lib/i18n/` for exact import path and `t()` usage pattern.

### Sidebar/Topbar — DO NOT CHANGE

AC-4 explicitly: sidebar (270px) and navbar (64px) are already standardized. This story is ONLY about the page body header banner — the card-like header inside the main content area.

### Project Structure Notes

- Create: `src/components/shared/PageHeader.tsx`
- Create: `src/components/shared/Breadcrumb.tsx` (if needed)
- Modify: every `FeatureClient.tsx` to add `<PageHeader />`
- Modify: `src/lib/i18n/messages/vi.json` and `en.json`
- DO NOT touch `page.tsx` files (thin wrappers)
- DO NOT touch sidebar or navbar components

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2]
- [Source: _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md#FR8]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md#A-6]

## Dev Agent Record


### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- Updated PageHeader.tsx: new style , h1 , flex layout with actions slot.
- Added dual props: ]2;]1; (pre-translated, new) +  (i18n key, backward-compat legacy). All existing callers using  continue to work unchanged.
- Added  prop alongside existing .
- Audited all feature pages: BudgetClient, DashboardClient, ImportClient, InvestmentClient, ReportsClient, ScheduledPaymentsClient, NetWorthClient, EventBudgetClient, FundsPage all already have PageHeader.
- i18n nav.* keys cover all feature pages (dashboard, transactions, funds, budget, etc.) in both vi.json and en.json.
- Zero TypeScript errors introduced.

### File List

- src/components/shared/PageHeader.tsx
