# GrowBase Visual Audit - Redesign Plan
# Date: 2026-06-19
# Auditor: design-reviewer

## EXECUTIVE SUMMARY
TOTAL_SCREENS:13 TOTAL_COMPONENTS:~80
SLOP_AVG:2.3 (clean codebase, consistent patterns)
CRITICAL_THEME_ISSUE: User wants REVERT from lavender to copper/zinc

---

## THEME REVERT PLAN (USER REQUEST - HIGH PRIORITY)

### Current State
- globals.css: --primary mapped to lavender hsl(245,58%,63%)
- Dark mode: soft charcoal hsl(230,15%,10%) - NOT zinc-950
- tailwind.config.ts: has both `copper` and `lavender` color families
- Style guide says: "Lavender = primary UI accent", "Copper = brand only"

### User Wants
- Primary accent: #D97757 (copper) for EVERYTHING (buttons, CTAs, links, active nav)
- Dark base: zinc-950 (NOT soft charcoal)
- Base theme: shadcn/ui zinc (NOT lavender-tinted blue-grey)
- Remove lavender as UI accent entirely

### FILES TO CHANGE
1. `src/app/globals.css` - swap --primary from lavender to copper, dark bg to zinc-950
2. `tailwind.config.ts` - remove lavender color family, keep copper
3. NO component changes needed (all use semantic tokens correctly)

### REVERT SPEC
```
:root {
  --background: 0 0% 100%;        /* pure white, zinc style */
  --foreground: 240 10% 3.9%;     /* zinc-950 */
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 17 62% 60%;          /* copper #D97757 */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4.8% 95.9%;    /* zinc-100 */
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 17 62% 60%;             /* copper for focus ring */
  --radius: 0.75rem;
  --surface: 240 4.8% 95.9%;
  --elevated: 240 4.8% 93%;
  --inset: 240 5.2% 93%;
  --copper: 17 62% 60%;
}

.dark {
  --background: 240 10% 3.9%;     /* zinc-950 */
  --foreground: 0 0% 98%;         /* zinc-50 */
  --card: 240 10% 7%;             /* zinc-900ish */
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 7%;
  --popover-foreground: 0 0% 98%;
  --primary: 17 53% 47%;          /* copper-dark #B85C37 - better contrast on dark */
  --primary-foreground: 0 0% 98%;
  --secondary: 240 3.7% 15.9%;    /* zinc-800 */
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 17 53% 47%;
  --surface: 240 10% 7%;
  --elevated: 240 3.7% 15.9%;
  --inset: 240 10% 5%;
  --copper: 17 62% 60%;
}
```

---

## PER-SCREEN AUDIT

### 1. LAYOUT (AppShell, DesktopDrawer, BottomNav, TopHeader)

SCREEN:AppShell SLOP:2 PRIORITY:M
ISSUES:
- AppShell lg:bg-card+lg:rounded-3xl = card wrapping entire content area on desktop. Unusual, creates double-card nesting visually
- DesktopDrawer active state uses bg-background (page bg) instead of copper-muted bg. Will look odd after theme revert
- DesktopDrawer growth bars use bg-primary (currently lavender, should be copper after revert) - CORRECT behavior, will auto-fix
- BottomNav: no border-t and no explicit h-16, only min-h-[44px] per item. Height determined by content
- TopHeader: no i18n for month display (hardcoded `vi` locale) - should use translation system locale
FIX:
- Consider removing lg:bg-card wrapper from AppShell or making it bg-background
- DesktopDrawer active: change bg-background to bg-primary/10 or bg-copper-muted after revert
- TopHeader: use dynamic locale from i18n context

SCREEN:DesktopDrawer SLOP:1 PRIORITY:L
ISSUES:
- Growth bars use bg-primary which is semantic - good, will auto-adapt
- No separator line between nav and settings footer - uses mt-auto only
- Active nav dot at left-0 may be partially clipped by overflow
FIX:
- Add thin border-t or visual separator above settings link
- Check dot visibility - may need left-1.5 instead of left-0

SCREEN:BottomNav SLOP:1 PRIORITY:L
ISSUES:
- FAB in bottom nav: -mt-4 offset works but FAB has no aria-label for accessibility
- Sheet "More" items: no background highlight for active state in the more sheet
FIX:
- Add aria-label to FAB "Them giao dich moi"
- Add bg-accent to active items in More sheet

SCREEN:TopHeader SLOP:2 PRIORITY:M
ISSUES:
- Hardcoded `vi` locale in date-fns format - should respect i18n setting
- No sticky positioning - scrolls away on mobile
- Missing capitalize behavior for non-vi locales
FIX:
- Use locale from useTranslation
- Consider sticky top-0 z-10 on mobile

### 2. UI PRIMITIVES

SCREEN:Button SLOP:1 PRIORITY:L
ISSUES:
- text-base for button text - spec says text-sm. Buttons will look slightly large
- shadow-soft-xs on ALL variants including ghost/link - ghost buttons shouldn't have shadow
- sm size has rounded-xl redundantly (already in base)
FIX:
- Change base to text-sm font-medium
- Remove shadow-soft-xs from ghost and link variants
- Clean up redundant rounded-xl on sm

SCREEN:Card SLOP:1 PRIORITY:L
ISSUES:
- No border by default (correct per spec)
- Missing hover variant in base component
FIX:
- None critical

SCREEN:Input SLOP:1 PRIORITY:L
ISSUES:
- Missing ring-offset-2 in focus styles (has ring-2 ring-ring but no offset)
- No explicit focus-visible:border-primary per spec
FIX:
- Add focus-visible:ring-offset-2 focus-visible:border-primary

SCREEN:Badge SLOP:1 PRIORITY:L
ISSUES:
- Missing expense/warning/fund-type variants per style guide
- Only has default/secondary/outline/info/success
FIX:
- Add expense, warning, fundType variants

SCREEN:CurrencyInput SLOP:2 PRIORITY:M
ISSUES:
- Uses bg-background instead of bg-inset (inconsistent with Input component)
- Uses rounded-md instead of rounded-xl (inconsistent radius)
- Missing ring-offset-2 in focus styles
FIX:
- Change to bg-inset rounded-xl to match Input
- Add ring-offset-2

SCREEN:Switch SLOP:1 PRIORITY:L
ISSUES:
- Hardcoded bg-white on thumb - should be bg-card or a semantic token for dark mode compatibility
FIX:
- Keep as-is (white thumb on both themes is standard UX pattern)

SCREEN:Sheet SLOP:1 PRIORITY:L
ISSUES:
- Bottom sheet missing drag handle (spec says: w-10 h-1 rounded-full bg-muted mx-auto mt-3)
- Bottom sheet missing max-h-[85vh] in base variant
FIX:
- Add drag handle to bottom variant
- Add max-h constraint to bottom variant

SCREEN:Skeleton SLOP:1 PRIORITY:L
ISSUES:
- Clean, uses semantic bg-muted
FIX:
- None

### 3. ONBOARDING (WizardLayout + Steps)

SCREEN:WizardLayout SLOP:2 PRIORITY:M
ISSUES:
- Hardcoded Vietnamese text: "Buoc {n} / {m}", "Tiep tuc", "Quay lai", "Bo qua"
- pb-16 in footer good for nav clearance on mobile
- Progress bar uses bg-secondary (correct) + bg-primary fill (correct)
- WizardStep1Type currency buttons use rounded-md instead of rounded-xl (inconsistent)
FIX:
- Move all strings to i18n
- Change rounded-md to rounded-xl in WizardStep1Type

SCREEN:WizardStep1Type SLOP:2 PRIORITY:L
ISSUES:
- TypeCard uses border-primary bg-primary/10 for selected - will auto-adapt to copper
- Currency buttons: rounded-md inconsistency
- Hardcoded Vietnamese strings: "Ca nhan", "Gia dinh", "Tien te", etc.
FIX:
- i18n all strings
- Fix border radius consistency

### 4. DASHBOARD

SCREEN:DashboardClient SLOP:2 PRIORITY:M
ISSUES:
- 3 MetricCards in 2-col grid = 1 card orphaned on second row. Looks odd
- Manual card markup (rounded-2xl bg-card shadow-soft) repeated inline instead of using Card component
- SpendingDonut hardcodes behavior colors - should use semantic tokens
FIX:
- Use grid-cols-2 with col-span-2 on savings rate card, or use 3-col
- Use <Card> component consistently
- Move behavior colors to theme/constants

SCREEN:MetricCard SLOP:1 PRIORITY:L
ISSUES:
- Uses text-income/text-expense - good semantic colors
- No loading/skeleton state variant
FIX:
- None critical

SCREEN:SpendingDonut SLOP:2 PRIORITY:L
ISSUES:
- Hardcoded hex colors for behavior types
- No dark mode variant for chart colors
FIX:
- Move to CSS vars or use theme-aware colors

SCREEN:FundOverviewCard SLOP:1 PRIORITY:L
ISSUES:
- Fund color fallback is #D97757 (copper) - correct
- Good hover shadow transition
FIX:
- None

SCREEN:RecentTransactionsList SLOP:1 PRIORITY:L
ISSUES:
- Uses border-b dividers inside card - acceptable for list items
- Category fallback "?" character instead of icon - could use EmptyState pattern
FIX:
- Minor - use a nicer fallback icon

### 5. TRANSACTIONS

SCREEN:TransactionList SLOP:1 PRIORITY:L
ISSUES:
- Date header has sticky top-0 bg-background/80 backdrop-blur - good
- But missing explicit tracking-wide per spec on date headers
- Good: uses divide-y inside card for items
FIX:
- Add tracking-wide to date headers

SCREEN:TransactionItem SLOP:1 PRIORITY:L
ISSUES:
- Expense amount uses text-foreground instead of text-expense - inconsistent with spec
- Uses active:bg-accent - good tactile feedback
- Category circle uses bg-muted with inline style for account color tint
FIX:
- Change expense amount to text-expense (text-rose-400/600)

SCREEN:TransactionForm SLOP:2 PRIORITY:M
ISSUES:
- Hardcoded Vietnamese strings throughout: "Chi", "Thu", "So tien", "Danh muc", etc.
- Unusual income toggle: hardcoded bg-amber-50 - won't work in dark mode
- Custom checkbox (div h-4 w-4 with border) - should use proper checkbox component
FIX:
- i18n all strings
- Change amber bg to bg-amber-500/10 for dark mode compat
- Use proper checkbox or Switch component

SCREEN:QuickAddSheet SLOP:1 PRIORITY:L
ISSUES:
- max-h-[85vh] on SheetContent - correct
- Tabs with 3 columns - clean
FIX:
- None

SCREEN:CategoryPicker SLOP:1 PRIORITY:L
ISSUES:
- Good: uses Popover + ScrollArea
- Good: search with debounce-like behavior
- Category items use rounded-sm - inconsistent with xl radius system
FIX:
- Change rounded-sm to rounded-lg in category items

SCREEN:QuickAddFAB SLOP:1 PRIORITY:L
ISSUES:
- No aria-label on FAB button
- Position: bottom-20 right-4 - correct per spec
FIX:
- Add aria-label="Them giao dich"

SCREEN:FilterBar SLOP:2 PRIORITY:M
ISSUES:
- SelectTrigger with fixed w-[100px] and w-[140px] - may truncate on vi locale
- Hardcoded Vietnamese: "Tat ca", "Thu", "Chi"
- No clear/reset filters button
FIX:
- Use min-w instead of fixed w
- i18n strings

SCREEN:TransactionEditSheet SLOP:1 PRIORITY:L
ISSUES:
- System tx detail: amount uses toLocaleString() without font-mono - inconsistent
- Good: R3 check for system-generated tx immutability
FIX:
- Add font-mono tabular-nums to system tx amount display

### 6. FUNDS

SCREEN:FundCard SLOP:1 PRIORITY:L
ISSUES:
- Progress bar uses bg-muted for track instead of bg-elevated (inconsistent with BudgetProgressBar)
- Hardcoded Vietnamese: "Nap quy", "Rut quy", "Muc tieu:"
- Fund type labels hardcoded
FIX:
- Unify progress bar track to bg-elevated
- i18n all strings

SCREEN:FundList SLOP:1 PRIORITY:L
ISSUES:
- Total header uses font-bold instead of font-semibold (inconsistent)
- text-emerald-600 hardcoded for total - should use text-income
FIX:
- font-bold -> font-semibold
- text-emerald-600 -> text-income

SCREEN:ContributeModal SLOP:1 PRIORITY:L
ISSUES:
- Hardcoded Vietnamese strings
- Uses Dialog (correct for desktop, but on mobile should be Sheet)
FIX:
- i18n strings
- Consider responsive: Dialog on desktop, Sheet on mobile

SCREEN:MonthlyBufferBanner SLOP:3 PRIORITY:M
ISSUES:
- Hardcoded amber/amber-50 colors - dark mode incompatible
- border-amber-200 bg-amber-50 text-amber-900 - all hardcoded
- Hardcoded Vietnamese strings
FIX:
- Use bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400
- i18n strings

### 7. REPORTS

SCREEN:ReportsClient SLOP:1 PRIORITY:L
ISSUES:
- 4 tabs with text-xs - may be too small on mobile for touch
- Tab triggers have flex-1 - good for equal distribution
FIX:
- Consider scrollable tabs on very small screens

SCREEN:SpendingTab SLOP:1 PRIORITY:L
ISSUES:
- Clean structure, uses semantic colors
FIX:
- None

SCREEN:IncomeTab SLOP:1 PRIORITY:L
ISSUES:
- Section headers use uppercase tracking-wide - per spec
FIX:
- None

SCREEN:BudgetVsActualTab SLOP:1 PRIORITY:L
ISSUES:
- Status badge inline-styled (not using Badge component)
FIX:
- Consider using Badge component for status

SCREEN:FundReportTab SLOP:1 PRIORITY:L
ISSUES:
- Duplicate progress bar logic (also in FundCard, FundOverviewCard) - DRY violation
FIX:
- Extract FundProgressBar shared component

### 8. BUDGET

SCREEN:BudgetClient SLOP:1 PRIORITY:L
ISSUES:
- Clean layout, proper font-mono usage
- No empty state with CTA (just text "no data")
FIX:
- Use EmptyState component for zero budget data

SCREEN:BudgetGroupRow SLOP:1 PRIORITY:L
ISSUES:
- Expand chevron animation good (rotate-90)
- Edit button in expanded area meets 44px touch target
FIX:
- None

SCREEN:BudgetOverrideInput SLOP:1 PRIORITY:L
ISSUES:
- Raw number input without CurrencyInput pattern
- Good: all action buttons are 44x44
FIX:
- Consider percent-specific input component

### 9. NET WORTH

SCREEN:NetWorthClient SLOP:2 PRIORITY:M
ISSUES:
- Discrepancy banner: amber-500/20 border + amber-500/5 bg - ok for both themes
- Raw number input for balance recording (no CurrencyInput)
- Save button shows "..." as loading text - should use spinner
FIX:
- Use CurrencyInput for balance input
- Use Loader2 spinner for loading state

SCREEN:NetWorthChart SLOP:2 PRIORITY:L
ISSUES:
- Line stroke="#D97757" hardcoded - should use CSS var or theme token
- Second line #94A3B8 also hardcoded
FIX:
- Use theme-aware colors from CSS vars

SCREEN:NetWorthAccountRow SLOP:2 PRIORITY:M
ISSUES:
- Raw HTML input instead of Input component - missing focus ring, inconsistent styling
- Missing border-input class on the raw input
FIX:
- Use Input component or add full focus-visible styling

### 10. SCHEDULED PAYMENTS

SCREEN:ScheduledPaymentsClient SLOP:1 PRIORITY:L
ISSUES:
- Good: uses EmptyState for zero state
- Good: FAB-style add button with Plus icon
FIX:
- None

SCREEN:PaymentCard SLOP:1 PRIORITY:L
ISSUES:
- text-expense on amount - correct semantic color
- DueBadge: "due-soon" and "overdue" both use same rose color - confusing
FIX:
- Differentiate overdue (darker rose) from due-soon (lighter rose or amber)

SCREEN:MarkPaidDialog SLOP:2 PRIORITY:M
ISSUES:
- Uses native HTML <select> instead of shadcn Select component - inconsistent
- Native select missing focus ring styling
- text-secondary for label - should be text-muted-foreground
FIX:
- Replace native <select> with Select component
- Fix label color

SCREEN:ScheduledPaymentForm SLOP:2 PRIORITY:M
ISSUES:
- Uses native HTML <select> for period - inconsistent with rest of app
- Hardcoded Vietnamese: "Ten khoan", "So tien", etc.
- Amount uses type="number" raw Input instead of CurrencyInput
FIX:
- Use Select component
- i18n all strings
- Use CurrencyInput for amount

### 11. SETTINGS

SCREEN:SettingsMenu SLOP:1 PRIORITY:L
ISSUES:
- Hardcoded Vietnamese labels
- Clean card-per-item layout with hover shadow
- Good touch targets (min-h-[44px])
FIX:
- i18n strings

SCREEN:DebtCard SLOP:2 PRIORITY:M
ISSUES:
- Status badges use hardcoded Tailwind colors (yellow-100, green-100, blue-100) - dark mode variants exist but are manual
- Uses p-5 instead of p-4 (inconsistent with other cards)
FIX:
- Use semantic badge variants or consistent opacity-based colors
- Normalize to p-4

SCREEN:IncomeSourceCard SLOP:2 PRIORITY:M
ISSUES:
- Edit button: h-8 w-8 - BELOW 44px touch target minimum!
- Hardcoded Vietnamese: "Tu {date}"
FIX:
- Change to min-h-[44px] min-w-[44px]
- i18n strings

SCREEN:AccountSettingsCard SLOP:1 PRIORITY:L
ISSUES:
- "Credit Card" badge text in English - should be i18n
- Good touch targets on edit/deactivate buttons
FIX:
- i18n "Credit Card" -> "The tin dung"

### 12. SHARED COMPONENTS

SCREEN:BudgetProgressBar SLOP:1 PRIORITY:L
ISSUES:
- Uses bg-elevated for track (correct per spec)
- Thresholds: >90 rose, >70 amber, else emerald - correct
FIX:
- None

SCREEN:DueBadge SLOP:2 PRIORITY:L
ISSUES:
- "due-soon" and "overdue" share same colors (both rose)
- "upcoming" uses amber - correct
FIX:
- Differentiate overdue from due-soon

SCREEN:EmptyState SLOP:1 PRIORITY:L
ISSUES:
- Clean, centered layout
- CTA button uses size="sm" which still meets 44px
FIX:
- None

SCREEN:ConfirmDialog SLOP:1 PRIORITY:L
ISSUES:
- Hardcoded Vietnamese: "Huy", "Dang xu ly..."
FIX:
- i18n strings

SCREEN:SkeletonList SLOP:1 PRIORITY:L
ISSUES:
- Good: matches transaction item layout shape
FIX:
- None

SCREEN:SkeletonCard SLOP:1 PRIORITY:L
ISSUES:
- Good: matches fund card layout shape
FIX:
- None

### 13. LOGIN + INVITE

SCREEN:LoginPage SLOP:1 PRIORITY:L
ISSUES:
- "v0.1.0" version string in footer - remove per design-taste-frontend (no version footers)
- BrandLogo tone not responsive to dark mode
FIX:
- Remove version string
- Add dark mode tone detection

SCREEN:InviteClient SLOP:2 PRIORITY:M
ISSUES:
- text-zinc-400 hardcoded in 3 places - should be text-muted-foreground
- Shell component: missing bg-background on main
FIX:
- Replace text-zinc-400 with text-muted-foreground
- Add bg-background to Shell main

---

## CROSS-CUTTING ISSUES (apply to all screens)

### H1: THEME REVERT (HIGH)
All screens use semantic tokens (bg-primary, text-primary, etc.) correctly.
Theme revert requires ONLY globals.css + tailwind.config.ts changes.
No component code changes needed for the color swap.
Estimated effort: 30 minutes.

### H2: i18n COVERAGE (HIGH)
~40% of user-facing strings are still hardcoded Vietnamese.
Affected: WizardLayout, WizardSteps, TransactionForm, FundCard, FundList,
ContributeModal, WithdrawForm, MonthlyBufferBanner, SettingsMenu,
ConfirmDialog, FilterBar, ScheduledPaymentForm, DebtCard, IncomeSourceCard.
Not blocking redesign but blocks English language support.

### M1: NATIVE SELECT INCONSISTENCY (MED)
MarkPaidDialog and ScheduledPaymentForm use native <select> instead of
shadcn Select component. Inconsistent styling, missing focus rings.

### M2: CURRENCYINPUT RADIUS/BG (MED)
CurrencyInput uses rounded-md + bg-background while Input uses rounded-xl + bg-inset.
Visual inconsistency on all forms with both components.

### M3: HARDCODED CHART COLORS (MED)
SpendingDonut and NetWorthChart hardcode hex colors.
Won't adapt to theme changes or dark mode properly.

### M4: DUPLICATE PROGRESS BAR LOGIC (LOW)
Fund progress bar code duplicated in FundCard, FundOverviewCard, FundReportTab.
Should extract shared FundProgressBar component.

### L1: TOUCH TARGET VIOLATION (LOW)
IncomeSourceCard edit button: h-8 w-8 (32x32px < 44px minimum)

### L2: BUTTON TEXT SIZE (LOW)
Button base uses text-base, spec says text-sm.
All buttons across the app are slightly oversized.

---

## REDESIGN PRIORITY ORDER

### Phase 1: Theme Revert (1 hour)
1. globals.css - swap to copper/zinc tokens
2. tailwind.config.ts - remove lavender family
3. Verify dark mode zinc-950 base
4. Test all screens in both themes

### Phase 2: Consistency Fixes (2 hours)
1. CurrencyInput: match Input component styling
2. Replace native <select> with Select component (2 files)
3. Button: text-base -> text-sm, remove ghost shadow
4. Sheet: add drag handle to bottom variant
5. IncomeSourceCard: fix touch target

### Phase 3: Visual Polish (2 hours)
1. InviteClient: fix text-zinc-400 hardcodes
2. MonthlyBufferBanner: fix dark mode colors
3. DebtCard: unify badge color system
4. DueBadge: differentiate overdue vs due-soon
5. Chart colors: theme-aware
6. Remove version string from login
7. DesktopDrawer: improve active state styling
8. TopHeader: i18n locale

### Phase 4: DRY Refactors (1 hour)
1. Extract FundProgressBar shared component
2. Unify progress bar track color (elevated everywhere)
3. Extract shared card patterns into composition

### Phase 5: i18n Completion (separate sprint)
- Move all hardcoded Vietnamese to vi.json
- Verify en.json coverage

---

## SLOP SCORECARD

| Screen | Slop | Priority | Key Issue |
|--------|------|----------|-----------|
| AppShell | 2 | M | Desktop card wrapper nesting |
| DesktopDrawer | 1 | L | Clean |
| BottomNav | 1 | L | FAB aria-label |
| TopHeader | 2 | M | Hardcoded vi locale |
| Button | 1 | L | text-base should be text-sm |
| Card | 1 | L | Clean |
| Input | 1 | L | Clean |
| Badge | 1 | L | Missing variants |
| CurrencyInput | 2 | M | Inconsistent radius/bg |
| Sheet | 1 | L | Missing drag handle |
| WizardLayout | 2 | M | Hardcoded i18n |
| DashboardClient | 2 | M | Orphaned metric card |
| TransactionList | 1 | L | Clean |
| TransactionItem | 1 | L | Expense color |
| TransactionForm | 2 | M | Dark mode amber, i18n |
| FundCard | 1 | L | Track color |
| ContributeModal | 1 | L | Clean |
| MonthlyBufferBanner | 3 | M | Dark mode incompatible |
| ReportsClient | 1 | L | Clean |
| BudgetClient | 1 | L | Clean |
| NetWorthClient | 2 | M | Raw inputs |
| ScheduledPaymentsClient | 1 | L | Clean |
| PaymentCard | 1 | L | DueBadge colors |
| MarkPaidDialog | 2 | M | Native select |
| ScheduledPaymentForm | 2 | M | Native select, raw input |
| SettingsMenu | 1 | L | i18n only |
| DebtCard | 2 | M | Hardcoded dark mode colors |
| IncomeSourceCard | 2 | M | Touch target violation |
| AccountSettingsCard | 1 | L | i18n "Credit Card" |
| LoginPage | 1 | L | Version string |
| InviteClient | 2 | M | Hardcoded zinc colors |

OVERALL: Clean codebase. Low slop. Main work = theme revert + consistency fixes.
