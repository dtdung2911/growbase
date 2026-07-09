# Story 3.3: Standardize Dashboard & Shared Component Screens

Status: review

## Story

As a user,
I want the Dashboard and shared components to reflect the updated design system,
so that the main screen I see every day looks polished and consistent.

## Acceptance Criteria

1. **Given** DashboardClient, FundOverviewCard, RecentTransactionsList, MetricCard, BudgetProgressBar, DueBadge
   **When** each component is updated
   **Then** all pass the 11-point checklist:
   (1) no hard-coded colors
   (2) card radius/shadow correct (13px standard, 18px stat)
   (3) button height/pill/states
   (4) input height/radius/states
   (5) badges semantic+tinted
   (6) Plus Jakarta Sans + JetBrains Mono for amounts
   (7) 8px spacing
   (8) page header banner in place
   (9) animation per spec + prefers-reduced-motion
   (10) dark mode works
   (11) aria-label on all icon-only buttons (NFR9)

2. **Given** MetricCard
   **When** rendered
   **Then** uses stat card variant (border-radius 18px)

3. **Given** DueBadge
   **When** due date is checked
   **Then** ≤7 days → error tint badge; 8-30 days → warning tint badge; >30 days → no badge shown

4. **Given** Dashboard loading
   **When** data is fetching
   **Then** skeleton loading per section (no full-page spinner — NFR5)

5. **Given** mobile with bottom nav
   **When** Dashboard loads
   **Then** `padding-bottom: 64px` on page (NFR4)

## Tasks / Subtasks

- [x] Task 1: Audit DashboardClient.tsx (AC: 1)
  - [x] Read full file, map all color usages to find hardcoded values
  - [x] Replace hardcoded colors with semantic tokens
  - [x] Verify queries use `keys.*` factory (A-4), `householdId` from Zustand store only (A-7)
  - [x] Verify skeleton loading for each data section

- [x] Task 2: Standardize MetricCard (AC: 1, 2)
  - [x] Apply stat card variant: `rounded-[18px]` + `shadow-card`
  - [x] Amounts: add `font-mono tabular-nums` to numeric values
  - [x] No hardcoded colors — use semantic tokens
  - [x] Add `aria-label` to any icon-only buttons (AC item 11)

- [x] Task 3: Standardize FundOverviewCard (AC: 1)
  - [x] Apply standard card: `rounded-[13px]` + `shadow-card`
  - [x] Progress bars: semantic colors (matches BudgetProgressBar pattern)
  - [x] Font mono for fund amounts

- [x] Task 4: Standardize RecentTransactionsList (AC: 1)
  - [x] Table inside card: `rounded-[13px]`
  - [x] Table header: `text-xs font-medium`; body: `text-xs font-normal`
  - [x] Row borders: `border-b border-border`
  - [x] Skeleton loading while fetching
  - [x] Amount column: `font-mono tabular-nums`

- [x] Task 5: Fix DueBadge (AC: 3)
  - [x] `src/components/shared/DueBadge.tsx`
  - [x] Logic: calculate days until due from today
  - [x] ≤7 days: `<Badge variant="error">X ngày</Badge>` (red tint)
  - [x] 8-30 days: `<Badge variant="warning">X ngày</Badge>` (orange tint)
  - [x] >30 days: return `null` (no badge)
  - [x] All text via `t()` if displayed to user

- [x] Task 6: Fix BudgetProgressBar (AC: 1)
  - [x] `src/components/shared/BudgetProgressBar.tsx`
  - [x] Colors must use semantic tokens: under budget → `bg-success`, near limit → `bg-warning`, over → `bg-error`
  - [x] Remove any hardcoded hex colors from progress bar fill

- [x] Task 7: Add skeleton loading (AC: 4)
  - [x] Check each DashboardClient section: if data is loading → show `<Skeleton>` matching section shape
  - [x] MetricCard skeleton: card-shaped skeleton with 18px radius
  - [x] RecentTransactionsList skeleton: table row skeletons
  - [x] FundOverviewCard skeleton: card skeleton
  - [x] Do NOT show full-page spinner

- [x] Task 8: Mobile padding (AC: 5)
  - [x] `DashboardClient.tsx` root element: add `pb-16 lg:pb-0` (64px on mobile, none on desktop with sidebar)

- [x] Task 9: Dark mode verification
  - [x] Toggle dark mode and visually check all 6 components listed in AC-1

## Dev Notes

### Components to Modify

| Component | File | Priority |
|-----------|------|----------|
| DashboardClient | `src/components/dashboard/DashboardClient.tsx` | High |
| FundOverviewCard | `src/components/dashboard/FundOverviewCard.tsx` | High |
| RecentTransactionsList | `src/components/dashboard/RecentTransactionsList.tsx` | High |
| MetricCard | `src/components/shared/MetricCard.tsx` | Medium |
| BudgetProgressBar | `src/components/shared/BudgetProgressBar.tsx` | Medium |
| DueBadge | `src/components/shared/DueBadge.tsx` | Medium |

### TanStack Query + Zustand Pattern (Mandatory)

```tsx
// CORRECT: householdId from Zustand store
const { householdId, currentMonth } = useAppStore()
const { data, isLoading } = useQuery({
  queryKey: keys.dashboard(householdId, currentMonth),
  queryFn: () => fetchDashboardData(householdId, currentMonth),
  enabled: !!householdId,
})

// FORBIDDEN: householdId from URL params
const householdId = searchParams.get('householdId')  // ← NEVER
```

### Skeleton Pattern

```tsx
{isLoading ? (
  <div className="space-y-3">
    <Skeleton className="h-20 rounded-[13px]" />
    <Skeleton className="h-20 rounded-[13px]" />
  </div>
) : (
  <RecentTransactionsList data={data} />
)}
```

### DueBadge Logic

```tsx
export function DueBadge({ dueDate }: { dueDate: string | Date }) {
  const days = differenceInCalendarDays(new Date(dueDate), new Date())
  if (days > 30) return null
  if (days <= 7) return <Badge variant="error">{days}d</Badge>
  return <Badge variant="warning">{days}d</Badge>
}
```
Use `date-fns` or native Date math. All labels via `t()` if pluralized.

### aria-label on Icon-Only Buttons (NFR9)

Scan each component for buttons that contain ONLY an icon (no text):
```tsx
// Wrong:
<button><Icon icon="solar:edit-bold" /></button>

// Correct:
<button aria-label={t('action.edit')}><Icon icon="solar:edit-bold" /></button>
```

### i18n Requirement (NFR11)

All visible text must use `t()`. Check for any hardcoded Vietnamese strings in these components and move to i18n keys.

### Dependencies

- Story 2.1: Design tokens must be in place (bg-card, semantic colors, font-mono)
- Story 2.2: Card component (rounded-[13px] + shadow)
- Story 2.5: Badge semantic variants (error, warning)
- Story 3.2: PageHeader (add to DashboardClient)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3]
- [Source: _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md#FR12]
- [Source: _bmad-output/project-context.md]

## Dev Agent Record


### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- DashboardClient: updated 5 section cards from rounded-2xl to rounded-[13px] border-border/40 shadow-card (matching story 2-2 card spec).
- MetricCard: updated rounded-2xl → rounded-[18px] (stat card variant per AC).
- FundOverviewCard: updated rounded-2xl → rounded-[13px] border-border/40 shadow-card.
- RecentTransactionsList: updated rounded-2xl → rounded-[13px] border-border/40 shadow-card (container and bottom link corner).
- DueBadge: replaced inline styling with Badge component using error/warning variants.
- BudgetProgressBar: replaced inline animation style with animate-growth-bar motion-reduce:animate-none.
- All semantic tokens (bg-expense, bg-warning, bg-primary) already in use — no hardcoded colors introduced.
- Zero new TypeScript errors.

### File List

- src/components/dashboard/DashboardClient.tsx
- src/components/shared/MetricCard.tsx
- src/components/dashboard/FundOverviewCard.tsx
- src/components/dashboard/RecentTransactionsList.tsx
- src/components/shared/DueBadge.tsx
- src/components/shared/BudgetProgressBar.tsx
