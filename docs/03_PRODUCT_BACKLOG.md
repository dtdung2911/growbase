# 03 — PRODUCT BACKLOG
> GrowBase MVP | BA/PM/PO: GrowBase Team | Dev: Claude Code
> Format: Epic → Story → Tasks + Acceptance Criteria

---

## READING GUIDE FOR CLAUDE CODE

1. Pick sprint from **SPRINT PLAN** section
2. Find all stories tagged with that sprint
3. Read story → tasks → AC → implement
4. Reference `01_BUSINESS_CONTEXT.md` for domain concepts
5. Reference `02_BUSINESS_RULES.md` for validation rules
6. Reference `04_TECHNICAL_SPEC.md` for schema + DB functions
7. Reference `05_UX_SPEC.md` for screen layouts

**MoSCoW:** M = Must, S = Should, C = Could | **Size:** S=<2h, M=2-4h, L=4-8h

---

## SPRINT PLAN

| Sprint | Focus | Duration | Stories |
|--------|-------|----------|---------|
| S0 | Foundation: Schema + Seed + Next.js init | 3 days | US-9.01 partial, schema tasks |
| S1 | Auth + Onboarding Wizard 7 steps | 5 days | US-1.01→1.05, US-2.01→2.02 |
| S2 | Transactions + Funds + App Shell | 5 days | US-3.01→3.05, US-4.01→4.05 |
| S3 | Dashboard + Reports + Net Worth + Scheduled | 5 days | US-5.01→5.06, US-6.01→6.02, US-7.01→7.03 |
| S4 | Settings + Debt Manager + Estimated + Polish | 5 days | US-2.03→2.04, US-6.03→6.05, US-8.01→8.04, US-9.04 |
| S5 | PWA + Deploy + Import | 3 days | US-9.01→9.03 |

---

## EPIC 1 — AUTH & HOUSEHOLD SETUP

### US-1.01 — Google OAuth Login `M` `M` `S1`
**As** a new user **I want** to sign in with Google **so that** I don't need a password.

**Tasks:**
- [ ] Supabase Google OAuth provider config
- [ ] `/auth/callback/route.ts`: exchange code → session
- [ ] `LoginPage`: "Đăng nhập với Google" button
- [ ] `middleware.ts`: session check → redirect logic

**AC:**
```gherkin
Given user not logged in When visit /dashboard Then redirect /login
Given login success And onboarding_completed=false Then redirect /setup
Given login success And onboarding_completed=true Then redirect /dashboard
Given logged in When visit /login Then redirect /dashboard
```

---

### US-1.02 — Wizard Step 1: Household Type + Currency `M` `M` `S1`
**As** a new user **I want** to choose Personal/Family and currency **so that** the app sets up correctly.

**Tasks:**
- [ ] `WizardStep1.tsx`: card select (Personal / Family) + currency toggle (VND / USD)
- [ ] Wizard progress bar component (6 or 7 steps depending on type)
- [ ] `POST /api/household`: upsert household (guard: if exists → UPDATE)
- [ ] `INSERT household_members` role='owner'

**AC:**
```gherkin
Given type=family Then wizard shows 7 steps (step 2 = invite members)
Given type=personal Then wizard shows 6 steps (skip step 2)
Given household already exists (back/refresh) Then UPDATE not INSERT
Given currency=VND Then all amounts display as "1.000.000 đ"
```

---

### US-1.03 — Wizard Step 2: Invite Members (Family only) `M` `M` `S1`
**As** a family owner **I want** to invite members by email **so that** we manage finances together.

**Tasks:**
- [ ] `WizardStep2.tsx`: email + display_name form, add multiple
- [ ] `POST /api/household/invite`: INSERT household_invitations + send Supabase email
- [ ] `/invite/[token]/page.tsx`: verify token → show household info → Accept/Reject
- [ ] `POST /api/household/invite/[token]/accept`: INSERT household_members
- [ ] Highlight note: "Thêm/xóa thành viên → Cài đặt → Thành viên"

**AC:**
```gherkin
Given valid token When accept Then member sees household data
Given expired token (>7 days) Then show "Link hết hạn, yêu cầu invite mới"
Given already a member When accept again Then show "Bạn đã là thành viên"
Given step 2 skipped Then household created with owner only, can invite later
```

---

### US-1.04 — Wizard Steps 3-4: Income + Accounts `M` `M` `S1`
**As** a user **I want** to enter income sources and accounts **so that** the system has financial context.

**Tasks:**
- [ ] `WizardStep3.tsx` (Income): source_name, amount (CurrencyInput), member_id dropdown, freq=monthly
- [ ] `WizardStep4.tsx` (Accounts): name, bank_name (dropdown VN banks), type, owner, is_credit_card
- [ ] `POST /api/income-sources`: INSERT income_sources (is_current=true)
- [ ] `POST /api/accounts`: INSERT accounts
- [ ] Validate: ≥1 income AND ≥1 account before proceeding

**AC:**
```gherkin
Given income_sources empty Then "Tiếp tục" button disabled
Given accounts empty Then "Tiếp tục" button disabled
Given is_credit_card=true Then show hint "Thanh toán thẻ tín dụng = chuyển khoản nội bộ"
Given multiple income sources entered Then total income displayed at bottom
```

---

### US-1.05 — Wizard Step 5: Debt Entry → Auto Budget `M` `M` `S1`
**As** a user with loans **I want** to enter my debts **so that** the system auto-calculates my repayment budget.

**Tasks:**
- [ ] `WizardStep5.tsx`: DebtForm (creditor_name, debt_type, monthly_payment, remaining_amount, expected_end_date, member_id)
- [ ] Add multiple debts button
- [ ] Skip button (sets debt_pct=0 in budget)
- [ ] `POST /api/debt`: INSERT debt_entries → triggers `recalculate_debt_budget()`
- [ ] Show calculated debt_pct preview: "Ngân sách trả nợ: X%"

**AC:**
```gherkin
Given monthly_payment=4.2M AND income=50M Then debt_pct = 8.4% displayed
Given step skipped Then budget step 7: "Chi trả nợ" = 0%, user can edit
Given debt entered Then budget step 7: "Chi trả nợ" = debt_pct, locked
Given multiple debts entered Then debt_pct = SUM(monthly_payments)/income * 100
```

---

## EPIC 2 — CATEGORY & BUDGET SETUP

### US-2.01 — Wizard Step 6: Category Preview `M` `M` `S1`
**As** a user **I want** to see suggested categories **so that** I know how spending will be classified.

**Tasks:**
- [ ] `WizardStep6.tsx`: read-only category tree display (grouped by cost_type)
- [ ] Show count: "XX danh mục trong X nhóm"
- [ ] Callout highlight: "Thêm/chỉnh danh mục → Cài đặt → Danh mục"
- [ ] Single CTA: "Tiếp tục" (no input required)

**AC:**
```gherkin
Given system categories seeded Then display all active categories
Given user clicks "Tiếp tục" Then proceed to step 7 immediately
```

---

### US-2.02 — Wizard Step 7: Budget Setup `M` `M` `S1`
**As** a user **I want** to review and adjust budget percentages **so that** allocation matches my family.

**Tasks:**
- [ ] `WizardStep7.tsx`: list 16 budget lines + % inputs (system lines)
- [ ] "Chi trả nợ" row: locked icon if debt_entries exist, editable if not
- [ ] Realtime total % counter (color: green=≤100, red=>100)
- [ ] VND amount auto-calculated per line (= % × monthly_income)
- [ ] `UPSERT budget_baselines` on submit (copy system template to household)
- [ ] `SET households.onboarding_completed = true` → redirect /dashboard

**AC:**
```gherkin
Given total_pct > 100 Then disable "Hoàn thành" + show "Tổng vượt 100%"
Given debt_entries.status=active Then "Chi trả nợ" row locked, shows lock icon
Given user changes pct Then VND amount recalculates instantly
Given submit success Then onboarding_completed=true AND redirect /dashboard
```

---

### US-2.03 — Settings: Category Manager `M` `M` `S4`
**As** a user **I want** to add/edit/remove categories **so that** I can customize classification.

**Tasks:**
- [ ] `/settings/categories/page.tsx`: accordion (cost_type → group → category)
- [ ] System categories: show lock icon 🔒, disable edit/delete buttons
- [ ] Custom category form: name, group (dropdown), behavior_type (auto from group, editable), icon
- [ ] `POST /api/categories`: INSERT with is_system=false
- [ ] `PUT /api/categories/[id]`: block if is_system=true (BR-SY-001)
- [ ] `DELETE /api/categories/[id]`: soft-delete if has transactions (BR-CA-003)

**AC:**
```gherkin
Given is_system=true Then Edit/Delete buttons not rendered
Given custom category has 0 transactions Then hard DELETE allowed
Given custom category has transactions Then SET is_active=false only
Given new category saved Then appears in CategoryPicker immediately
```

---

### US-2.04 — Settings: Budget Manager `M` `M` `S4`
**As** a user **I want** to manage budgets **so that** I can customize beyond system defaults.

**Tasks:**
- [ ] `/settings/budget/page.tsx`: system lines (% editable) + custom lines (full CRUD)
- [ ] "Thêm ngân sách tùy chỉnh" form: name, linked_category_group_ids (multi-select), budget_pct
- [ ] Total % validator across all lines
- [ ] System line "Chi trả nợ": locked if is_auto_calculated=true, tooltip

**AC:**
```gherkin
Given system budget When edit name Then API rejects (BR-SY-002)
Given custom budget Then can edit name, description, linked groups, pct
Given total pct > 100 Then Save blocked
Given is_auto_calculated=true Then "Chi trả nợ" shows locked tooltip
```

---

## EPIC 3 — TRANSACTION MANAGEMENT

### US-3.01 — Quick Add Transaction `M` `M` `S2`
**As** a user **I want** to add transactions in <15 seconds on mobile.

**Tasks:**
- [ ] `TransactionForm.tsx`: amount (CurrencyInput large), direction toggle (Thu/Chi), category (CategoryPicker), account (Select), date (DatePicker default today), description (optional)
- [ ] `CurrencyInput`: raw number when focused, formatted VND on blur
- [ ] Toggle `is_unusual_income` when direction=in
- [ ] behavior_type: auto from category, display as read-only chip
- [ ] `QuickAddFAB`: desktop = fixed bottom-right button, mobile = bottom nav "+" 
- [ ] Bottom sheet on mobile, side panel on desktop
- [ ] `POST /api/transactions` → optimistic update TanStack Query
- [ ] Toast: success / error

**AC:**
```gherkin
Given direction=out Then CategoryPicker shows only expense/debt/savings categories
Given direction=in Then CategoryPicker shows only income categories
Given direction=in Then is_unusual_income toggle visible
Given category selected Then behavior_type chip shows, no edit allowed
Given submit success Then transaction appears in list without page reload
Given submit fail Then show error toast, form stays open
```

---

### US-3.02 — Transaction List `M` `M` `S2`
**As** a user **I want** to view transactions by month, grouped by day.

**Tasks:**
- [ ] `/transactions/page.tsx`: MonthPicker + list grouped by date
- [ ] `TransactionItem`: category icon/color, description, amount (green=in, red=out)
- [ ] Filter bar: Category dropdown, Account dropdown, behavior_type filter
- [ ] Empty state: "Chưa có giao dịch. Bấm + để thêm."
- [ ] Skeleton loading (6 rows)

**AC:**
```gherkin
Given month selected Then show only transactions in that month
Given filter by category Then list updates client-side (no refetch)
Given 0 transactions Then empty state with CTA shown
```

---

### US-3.03 — Edit / Delete Transaction `M` `M` `S2`
**As** a user **I want** to fix or remove a transaction I entered incorrectly.

**Tasks:**
- [ ] Click transaction → `TransactionEditSheet` (pre-filled form)
- [ ] `PUT /api/transactions/[id]` → invalidate queries
- [ ] Confirm dialog before DELETE
- [ ] `DELETE /api/transactions/[id]` → optimistic remove

**AC:**
```gherkin
Given transaction clicked Then EditSheet opens with all fields pre-filled
Given update submitted Then list updates without reload
Given delete confirmed Then transaction removed from list immediately
Given delete cancelled Then nothing changes
```

---

### US-3.04 — Internal Transfer (incl. CC Payment) `M` `M` `S2`
**As** a user **I want** to record transfers between accounts without affecting my spending budget.

**Tasks:**
- [ ] `InternalTransferForm.tsx`: account_from, account_to, amount, date, note
- [ ] When account_to.is_credit_card=true: auto-label "Thanh toán thẻ [name]"
- [ ] `POST /api/transactions/transfer`: INSERT 2 transactions (both exclude_from_budget=true)
- [ ] Separate button "Chuyển khoản" in QuickAdd alongside Thu/Chi

**AC:**
```gherkin
Given internal transfer submitted Then 2 transactions created (out from, in to)
Given both transactions Then exclude_from_budget_report=true
Given account_to is_credit_card=true Then form auto-labels as CC payment
Given transfer transactions Then NOT appear in budget report / spending charts
```

---

### US-3.05 — Debt Repayment Transaction `M` `M` `S2`
**As** a user **I want** to link debt payments to specific loan entries.

**Tasks:**
- [ ] When category = "Chi trả nợ" then show "Khoản nợ" dropdown (debt_entries active)
- [ ] Set `transaction.debt_entry_id` on submit
- [ ] behavior_type auto = 'debt_repayment' (from category trigger)

**AC:**
```gherkin
Given category is "Chi trả nợ" Then debt dropdown appears
Given debt selected Then debt_entry_id saved with transaction
Given behavior_type = debt_repayment Then appears in budget "Chi trả nợ" tracking
```

---

## EPIC 4 — FUND MANAGEMENT

### US-4.01 — Fund List Overview `M` `M` `S2`
**As** a user **I want** to see all my funds with balances and progress.

**Tasks:**
- [ ] `/funds/page.tsx`: header (total in funds), FundCard list
- [ ] `FundCard`: icon, name, fund_type badge, balance, progress bar, months_to_target
- [ ] Monthly Buffer card: "Sẵn sàng cho tháng [M+1]: X đ"
- [ ] FAB: Create new fund

**AC:**
```gherkin
Given funds loaded Then total balance in header = SUM(all fund balances)
Given monthly_buffer fund And current_day in [1-10] Then show release banner
Given no funds Then empty state with "Tạo quỹ đầu tiên" CTA
```

---

### US-4.02 — Fund Contribute (Atomic) `M` `M` `S2`
**As** a user **I want** to add money to a fund each month.

**Tasks:**
- [ ] `ContributeModal.tsx`: amount (default=monthly_contribution), date, note
- [ ] `POST /api/funds/[id]/contribute` → calls `fund_contribute()` RPC
- [ ] Show new balance after success
- [ ] Loading state during RPC call

**AC:**
```gherkin
Given contribute success Then fund balance increases immediately
Given contribute tx Then exclude_from_budget=false (counts as spending)
Given contribute tx Then appears in transaction list as "Nạp [fund name]"
Given RPC fails Then balance unchanged, error toast shown
```

---

### US-4.03 — Fund Withdraw (Atomic) `M` `M` `S2`
**As** a user **I want** to withdraw from a fund for a specific expense.

**Tasks:**
- [ ] `WithdrawForm.tsx`: amount, category, account, description
- [ ] Validate: amount ≤ fund.current_balance
- [ ] `POST /api/funds/[id]/withdraw` → calls `fund_withdraw()` RPC

**AC:**
```gherkin
Given withdraw amount > balance Then block with "Số dư không đủ (còn X đ)"
Given withdraw success Then fund balance decreases immediately
Given withdraw tx Then exclude_from_budget=true (not in spending report)
```

---

### US-4.04 — Fund CRUD + Detail `M` `M` `S4`
**As** a user **I want** to create, configure, and view fund history.

**Tasks:**
- [ ] `/funds/[id]/page.tsx`: header + 2 tabs (History / Settings)
- [ ] Tab History: list fund_transactions grouped by month
- [ ] `FundForm`: dynamic fields by fund_type (see BR-FU-002)
- [ ] DELETE fund: confirm dialog if balance > 0

**AC:**
```gherkin
Given fund_type=emergency Then show target_months_expense field
Given fund_type=sinking Then show target_amount + target_date
Given fund_type=freedom And reset_monthly=true Then balance resets on 1st
Given fund deleted And balance>0 Then confirm "Quỹ còn X. Tiếp tục?"
```

---

### US-4.05 — Monthly Buffer Release `M` `M` `S2`
**As** a user **I want** to release my buffer fund when salary arrives.

**Tasks:**
- [ ] Dashboard banner: show if monthly_buffer.balance > 0 AND day in [1-10]
- [ ] Banner: "Bạn có X đ trong Quỹ đệm. Đã nhận lương?" + [Xác nhận] button
- [ ] `POST /api/funds/[id]/release`: SET released_at = now()
- [ ] Hide banner after release

**AC:**
```gherkin
Given current_day=5 And monthly_buffer.balance>0 And not released_this_month Then show banner
Given current_day=15 Then hide banner
Given already released this month Then hide banner
Given confirm clicked Then released_at set, banner dismissed
```

---

## EPIC 5 — DASHBOARD & REPORTS

### US-5.01 — Dashboard `M` `M` `S3`
**As** a user **I want** to see monthly financial overview on app load.

**Tasks:**
- [ ] `/dashboard/page.tsx`: MonthPicker + 5 metric cards + donut + budget + funds + recent tx
- [ ] Metric cards: Tổng thu / Tổng chi / Tiết kiệm / % Tiết kiệm / Chi phí lãng phí
- [ ] `SpendingDonut`: ApexCharts Donut grouped by behavior_type (fixed/variable/wasteful)
- [ ] `BudgetProgress`: bars per budget line, color safe/warning/danger
- [ ] `FundOverview`: mini list 6 funds max
- [ ] `RecentTransactions`: 5 most recent + "Xem tất cả →" link to /transactions
- [ ] Skeleton loading for all sections
- [ ] Monthly Buffer banner (from US-4.05)

**AC:**
```gherkin
Given dashboard loads Then all sections visible within 800ms
Given 0 transactions this month Then metrics show 0 + empty state
Given month changed Then all data refreshes for selected month
Given "Xem tất cả" clicked Then navigate to /transactions?month=selected
```

---

### US-5.02 — Report: Spending Tab `M` `M` `S3`
**As** a user **I want** to see spending breakdown by category group and behavior type.

**Tasks:**
- [ ] `/reports/page.tsx`: MonthPicker + 4 tabs
- [ ] Tab "Chi tiêu": table (group | amount | % of income | behavior_type badge)
- [ ] Summary row: total spending + % of income
- [ ] Sorted by amount descending

**AC:**
```gherkin
Given report loaded Then each row shows amount + % (amount/income * 100)
Given behavior_type=wasteful Then row has warning style
```

---

### US-5.03 — Report: Income Tab `M` `M` `S3`
**As** a user **I want** to see regular vs unusual income separately.

**Tasks:**
- [ ] Tab "Thu nhập": 2 sections (Thường xuyên / Bất thường)
- [ ] Filter: transactions WHERE direction=in, group by is_unusual_income
- [ ] Note for unusual income: "Nên chuyển vào quỹ tiết kiệm"

**AC:**
```gherkin
Given is_unusual_income=false Then appears in "Thu nhập thường xuyên"
Given is_unusual_income=true Then appears in "Thu nhập bất thường"
Given unusual income present Then show note about saving suggestion
```

---

### US-5.04 — Report: Budget vs Actual Tab `M` `M` `S3`
**As** a user **I want** to compare planned vs actual spending per budget line.

**Tasks:**
- [ ] Tab "Ngân sách": table (name | budget | actual | remaining | status icon)
- [ ] Color coding: 🟢 safe, 🟡 warning (>80%), 🔴 danger (>100%)
- [ ] Uses `get_budget_with_actuals()` RPC

**AC:**
```gherkin
Given actual > budget Then row shows red + negative remaining
Given actual > 80% of budget Then orange warning
Given actual < 80% of budget Then green safe
```

---

### US-5.05 — Report: Funds Tab `M` `M` `S3`
**As** a user **I want** to see fund activity (contributions + withdrawals) this month.

**Tasks:**
- [ ] Tab "Quỹ": table (fund name | contributed this month | withdrawn | net balance change)
- [ ] Group by fund_id from fund_transactions in month range

**AC:**
```gherkin
Given fund had 2 contributions Then show total contributed
Given fund had 1 withdrawal Then show withdrawal amount
Given net = contribution - withdrawal Then show net change
```

---

### US-5.06 — Budget Page `S` `M` `S3`
**As** a user **I want** to see budget with expandable groups and monthly override.

**Tasks:**
- [ ] `/budget/page.tsx`: list budget lines + progress bars
- [ ] Expand group → list transactions in that group this month
- [ ] Inline edit % for current month (creates budget_override)

**AC:**
```gherkin
Given budget line clicked Then expand to show transactions
Given % edited for month Then budget_override inserted (baseline unchanged)
Given next month Then override doesn't apply (baseline used)
```

---

## EPIC 6 — NET WORTH & DEBT

### US-6.01 — Net Worth Snapshot `M` `M` `S3`
**As** a user **I want** to record actual balances monthly and see discrepancy.

**Tasks:**
- [ ] `/net-worth/page.tsx`: account list + input fields for actual balance
- [ ] System balance shown alongside (from accounts data / fund balances)
- [ ] Discrepancy calculation: recorded - system
- [ ] Warning if |discrepancy| > 100,000 VND
- [ ] UPSERT net_worth_snapshots (1 per month)

**AC:**
```gherkin
Given user enters actual balances Then discrepancy auto-calculated
Given |discrepancy| > 100k Then warning "Chênh lệch X đ, kiểm tra lại?"
Given same month updated Then UPDATE existing snapshot
```

---

### US-6.02 — Net Worth History Chart `S` `M` `S3`
**As** a user **I want** to see my net worth trend over time.

**Tasks:**
- [ ] Line chart: total_recorded per month from net_worth_snapshots
- [ ] Short/long term asset breakdown

---

### US-6.03 — Debt Management Settings `M` `M` `S4`
**As** a user **I want** to manage my debts and mark them paid off.

**Tasks:**
- [ ] `/settings/debt/page.tsx`: list debt entries, status badges
- [ ] DebtForm: full CRUD
- [ ] "Tất toán" button → confirm → PATCH status=paid_off → recalculate budget
- [ ] Notification on full payoff (BR-DT-002)

**AC:**
```gherkin
Given debt marked paid_off Then recalculate_debt_budget() called
Given last debt paid_off Then show "🎉 Bạn đã trả hết nợ!" notification
Given debt added Then budget "Chi trả nợ" pct auto-updates
```

---

### US-6.05 — Estimated Expenses `S` `M` `S4`
**As** a user **I want** to plan for large upcoming expenses linked to savings funds.

**Tasks:**
- [ ] `/settings/estimated-expenses/page.tsx`: list + form
- [ ] Form: name, estimated_amount, target_date, linked_fund_id, status
- [ ] Show if linked Sinking Fund has enough balance

---

## EPIC 7 — SCHEDULED PAYMENTS

### US-7.01 — Scheduled Payments CRUD `M` `M` `S3`
**As** a user **I want** to track recurring subscriptions and bills.

**Tasks:**
- [ ] `/scheduled-payments/page.tsx`: list by status (active/cancelled)
- [ ] Form: name, period, amount, payment_method, next_due_date, notes
- [ ] Cancel / Reactivate status toggle

**AC:**
```gherkin
Given payment created Then appears in list with next_due_date
Given status=cancelled Then shown in separate section with muted style
```

---

### US-7.02 — Due Date Alerts `M` `M` `S3`
**As** a user **I want** to be alerted when subscriptions are due soon.

**Tasks:**
- [ ] Nav badge on "Khoản định kỳ" menu item
- [ ] Badge count = number of payments with next_due_date ≤ 30 days
- [ ] Red badge if ≤ 7 days (urgent)
- [ ] Inline "Sắp đến hạn" tag on payment card

**AC:**
```gherkin
Given next_due_date in 25 days Then orange badge on nav
Given next_due_date in 5 days Then red badge (urgent)
Given next_due_date > 30 days Then no badge
```

---

### US-7.03 — Mark Paid + Create Transaction `S` `M` `S3`
**As** a user **I want** to mark a payment as paid and optionally create a transaction.

**Tasks:**
- [ ] "Đã thanh toán" button → advance next_due_date (BR-SP-002)
- [ ] Optional prompt: "Tự động tạo giao dịch?" → if yes, INSERT transaction

---

## EPIC 8 — SETTINGS

### US-8.01 — Account Management `M` `M` `S4`
**Tasks:**
- [ ] `/settings/accounts/page.tsx`: list + AccountForm modal
- [ ] Soft delete (is_active=false), edit all fields
- [ ] Credit card toggle with hint

### US-8.02 — Income Source Management `M` `M` `S4`
**Tasks:**
- [ ] `/settings/income/page.tsx`: list sources (current + history)
- [ ] Edit: if amount changes → create new record (SCD Type 2)

### US-8.03 — Member Management `M` `M` `S4`
**Tasks:**
- [ ] `/settings/members/page.tsx`: list members + pending invites
- [ ] Owner: delete member, send new invite
- [ ] Member: leave household button

### US-8.04 — Household Settings `S` `M` `S4`
**Tasks:**
- [ ] Edit household name, type display, currency

---

## EPIC 9 — DEPLOY & INFRASTRUCTURE

### US-9.01 — Vercel Deploy `M` `M` `S0+S5`
**Tasks (S0):**
- [ ] `npm create next-app@14` with TypeScript + Tailwind + App Router
- [ ] Install: supabase-js, @supabase/auth-helpers-nextjs, @tanstack/react-query@5, zustand, react-hook-form, zod, apexcharts, react-apexcharts, date-fns, lucide-react
- [ ] `npx shadcn-ui@latest init` (zinc, CSS variables)
- [ ] Add shadcn components: button, card, input, select, dialog, sheet, tabs, badge, progress, form, toast, sonner, skeleton, command, popover, drawer, dropdown-menu, separator, avatar, label, alert-dialog
- [ ] Run schema SQL in Supabase (from 04_TECHNICAL_SPEC.md)
- [ ] Run seed SQL (cost_types, system category_groups, system categories)
- [ ] Set up `.env.local` with Supabase credentials

**Tasks (S5):**
- [ ] Supabase: add production URL to Auth Redirect URLs
- [ ] Vercel: create project, set env vars, deploy
- [ ] Smoke test: auth → wizard → transaction → fund → settings

**AC:**
```gherkin
Given Vercel deploy success Then app accessible at production URL
Given RLS active Then no cross-household data leak
Given smoke test pass Then all core flows work
```

---

### US-9.03 — Historical Data Import `S` `L` `S5`
**As** a user **I want** to import my existing Excel data into GrowBase.

**Tasks:**
- [ ] `src/scripts/import-excel.ts`: read GG Sheet export (xlsx)
- [ ] Map columns: date, amount, type, account, category, group → transaction fields
- [ ] Map category names → category_ids from DB
- [ ] Batch INSERT (100 rows per batch)
- [ ] Skip rows with missing required fields, log skipped count

---

### US-9.04 — UX Polish `M` `M` `S4`
**Tasks:**
- [ ] Audit: every list page has skeleton loading + empty state
- [ ] `ErrorBoundary` wrapper on main sections
- [ ] Mobile audit 375px: no horizontal scroll, all touch targets ≥ 44px
- [ ] Toast notifications: consistent pattern (success/error/loading) via sonner
- [ ] Confirm dialog before all destructive actions

---

## COMPONENT CHECKLIST

| Component | Used by | Sprint |
|-----------|---------|--------|
| `CurrencyInput` | TransactionForm, DebtForm, FundForm | S1 |
| `MonthPicker` | Dashboard, Transactions, Reports, Budget | S1 |
| `CategoryPicker` (3-tier) | TransactionForm | S2 |
| `QuickAddFAB` | All pages | S2 |
| `BudgetProgressBar` | Dashboard, Budget page | S3 |
| `FundCard` | Funds page, Dashboard | S2 |
| `TransactionItem` | Transaction list, Recent list | S2 |
| `ConfirmDialog` | Delete actions everywhere | S2 |
| `EmptyState` | Every list page | S2 |
| `SkeletonLoader` | Every page | S2 |
| `WizardLayout` | Onboarding | S1 |
| `DebtStatusBadge` | Debt list, Budget line | S4 |
