
# Fund Management UI Rebuild
✓ i18n fund keys — src/lib/i18n/messages/vi.json + en.json — added createFund, fundName, presets, groups, descs, warnings, etc.
✓ FundCard rewrite — src/components/funds/FundCard.tsx — FUND_TYPE_CONFIG colors, emergency<50% red warning, freedom remaining-this-month, withdraw disabled at balance=0; props onContribute/onWithdraw (parent owns modals). DEVIATION: months_to_target/effective_target not in Fund type → computed client-side from target_amount/monthly_contribution.
✓ ContributeModal rewrite — src/components/funds/ContributeModal.tsx — Sheet bottom, 50%/Chuẩn/2x presets, balance-after preview + progress bar, props fund|null/open/onClose. DEVIATION: success toast handled by useFundContribute hook (kept; not double-toasting).
✓ WithdrawModal new — src/components/funds/WithdrawModal.tsx — green warning banner, amount<=balance validate, CategoryPicker, account select, amber #EF9F27 submit.
✓ WithdrawForm retired — src/components/funds/WithdrawForm.tsx — converted to re-export shim of WithdrawModal (could not rm; no remaining importers).
✓ FundForm new — src/components/funds/FundForm.tsx — 3-step Sheet (type selector → common → type-specific), emergency 3/6/12 group, freedom per_member Switch. Uses useCreateFund + createFundSchema.
✓ FundList rewrite — src/components/funds/FundList.tsx — total/active/monthly summary, 5 grouped sections w/ colored labels, empty state CTA, owns Contribute/Withdraw/FundForm modals + create button.
✓ FundsPage update — src/app/(app)/funds/page.tsx — always render FundList (empty handled inside), max-w-2xl, pb-16. Removed page-level EmptyState (moved into FundList).
✓ tsc --noEmit — 0 errors project-wide

# Cost Type CRUD + Editable Categories Table
✓ Zod cost-type — src/lib/validations/cost-type.ts — create/update schemas + COST_TYPE_CODES enum
✓ Zod category-group — src/lib/validations/category-group.ts — DEVIATION: task said reuse useCategoryMutations for groups but group CRUD didn't exist; created schemas + routes + hook
✓ queryKeys.costTypes — src/lib/queries/queryKeys.ts
✓ cost-types API — src/app/api/cost-types/route.ts (GET+POST), src/app/api/cost-types/[id]/route.ts (PUT+DELETE, is_system guard, 409 if groups ref)
✓ category-groups API — src/app/api/category-groups/route.ts (POST), [id]/route.ts (PUT+DELETE, is_system guard, 409 if categories ref) — NEW, not in original task
✓ useCostTypes — src/lib/hooks/useCostTypes.ts — list+create+update+delete, invalidate costTypes+categories
✓ useCategoryGroupMutations — src/lib/hooks/useCategoryGroupMutations.ts — create/update/delete, invalidate categories
✓ useCategories extended — src/lib/hooks/useCategories.ts — added cost_type_id + is_system on group for tree merge
✓ CategoriesManager rewrite — src/components/settings/CategoriesManager.tsx — 3-level editable table (desktop) + accordion (mobile), inline edit/add, ConfirmDialog delete, system entities show lock + no edit/delete
✓ AddCostTypeSheet — src/components/settings/AddCostTypeSheet.tsx — sheet with code enum select
✓ InlineNameEditor + InlineAddRow — src/components/settings/ — inline rename/add inputs
✓ i18n — vi.json + en.json — settings.categories.* table keys (costType/group/category/behavior/actions/add*)
✓ tsc --noEmit passes clean
NOTE: category add inherits default_behavior_type from parent cost_type.code (cost_type codes == behavior_type enum values)

# Spike Login + Shared Components Redesign
✓ globals.css — fillProgress keyframe + .login-shell blob pseudo-elements (cyan #51c5ef top-right, coral #ff927d bottom-left, dark dims to 0.22)
✓ BudgetProgressBar — src/components/shared/BudgetProgressBar.tsx — 6px h, rounded-full, track #e7f0f8/dark elevated, primary fill, fillProgress 1.1s anim; >90 expense, >70 warning
✓ SkeletonList — src/components/shared/SkeletonList.tsx — border + shadow-card card style
✓ EmptyState — src/components/shared/EmptyState.tsx — card (border+shadow-card), primary-soft icon chip, min-h-11 CTA
✓ LoginButton — src/components/auth/LoginButton.tsx — outline social-btn style: min-h-14, rounded-[7px], font-extrabold, text-base; OAuth logic unchanged
✓ Brand SVGs — public/brand/*.svg — copper #D97757/#B85C37 → primary #0085db/#0076c2 (growth bars + accents)
✓ Login page — src/app/login/page.tsx — login-shell blobs, white card rounded-18px max-w-md shadow-card, BrandLogo top, "Đăng nhập" 38px font-extrabold, tagline, Google btn, terms note; mobile single col w/ smaller padding
- tsc --noEmit: PASS

## Spike Admin UI primitive alignment
✓ tabs — src/components/ui/tabs.tsx — border-bottom list, 3px active indicator (border-primary + text-primary)
✓ dialog — src/components/ui/dialog.tsx — rounded-[10px], shadow 0 18px 48px/.18, px-8 py-7, backdrop /.32
✓ alert-dialog — src/components/ui/alert-dialog.tsx — same modal style as dialog
✓ select — src/components/ui/select.tsx — min-h-52, rounded-lg, focus glow (primary/20), content rounded-[18px] shadow-card
✓ switch — src/components/ui/switch.tsx — w-[46px] h-6, knob h-5 w-5, translate-x-[22px]
✓ label — src/components/ui/label.tsx — text-ink + font-normal (was hardcoded zinc-400/font-medium)
✓ popover — src/components/ui/popover.tsx — rounded-[18px], shadow-card, border-border/40
✓ dropdown-menu — src/components/ui/dropdown-menu.tsx — rounded-[18px] shadow-card, items rounded-lg, sep bg-border
✓ sheet — src/components/ui/sheet.tsx — shadow 0 18px 48px/.18, backdrop /.32
✓ separator — src/components/ui/separator.tsx — already bg-border, no change
✓ CurrencyInput — src/components/ui/CurrencyInput.tsx — matched input (min-h-48, rounded-lg, focus glow)
✓ skeleton — src/components/ui/skeleton.tsx — bg-elevated, rounded-lg
✓ scroll-area — src/components/ui/scroll-area.tsx — 5px thin bar, thumb rounded-[20px] bg-border
✓ tsc --noEmit — pass, no errors

## Spike Admin page-level + typography pass
✓ loading skeletons → border-border/40 + shadow-card — dashboard/settings/net-worth/loading.tsx, shared/SkeletonList.tsx (SkeletonCard already done)
✓ TransactionItem → row py-[17px], h-11 icon, font-extrabold primary — components/transactions/TransactionItem.tsx
✓ TransactionList → card container border + shadow-card, divide-border/40 — components/transactions/TransactionList.tsx
✓ QuickAddFAB → shadow-float already present, no change
✓ FilterBar → toolbar selects, no change needed
✓ FundCard/FundList → border + shadow-card, progress bar bg-primary-soft/bg-primary, h-1.5, h-11 icon — components/funds/
✓ MonthlyBufferBanner → warning-soft alert tokens — components/funds/MonthlyBufferBanner.tsx
✓ ContributeModal → standard Dialog, no change
✓ BudgetClient/BudgetGroupRow → border + shadow-card, progress bg-primary-soft — components/budget/
✓ Reports tabs (Spending/Income/BudgetVsActual/FundReport) → border + shadow-card; status badges → success/warning/destructive soft tokens; fund progress → primary-soft — components/reports/
✓ NetWorthClient/AccountRow → border + shadow-card; discrepancy banner → warning-soft — components/net-worth/
✓ ScheduledPayments PaymentCard → border + shadow-card — components/scheduled-payments/PaymentCard.tsx
✓ Settings cards (Estimated/Invite/IncomeSource/Debt/BudgetBaseline/Categories/Member/AccountSettings) → border-border/40 + shadow-card — components/settings/
✓ BudgetTotalBar → semantic success/destructive soft + shadow-card — components/settings/BudgetTotalBar.tsx
✓ RecentTransactionsList → border + shadow-card — components/dashboard/RecentTransactionsList.tsx
✓ Font check: Plus Jakarta Sans loaded correctly in layout.tsx, no change
✓ tsc --noEmit clean
note: layout nav shadows (shadow-soft-md/xs in BottomNav/TopHeader/(app)/layout) left intact — nav surfaces, not card containers; onboarding/* out of scope

✓ loading spinners — i18n common.processing key — added to vi.json + en.json
✓ loading spinner — src/components/shared/ConfirmDialog.tsx — added Icon + useTranslation, "Đang xử lý..." now t("common.processing")
✓ loading spinner — src/components/settings/AddCustomBaselineForm.tsx
✓ loading spinner — src/components/settings/AccountEditForm.tsx
✓ loading spinner — src/components/settings/DebtForm.tsx
✓ loading spinner — src/components/settings/HouseholdSettingsForm.tsx
✓ loading spinner — src/components/settings/AddCategoryForm.tsx
✓ loading spinner — src/components/settings/EditCategoryDialog.tsx
✓ loading spinner — src/components/settings/BudgetBaselineManager.tsx
✓ loading spinner — src/components/settings/IncomeSourceForm.tsx
✓ loading spinner — src/components/settings/EstimatedExpenseForm.tsx
✓ loading spinner — src/components/transactions/TransactionForm.tsx
✓ loading spinner — src/components/transactions/InternalTransferForm.tsx
✓ loading spinner — src/components/funds/ContributeModal.tsx
✓ loading spinner — src/components/funds/WithdrawForm.tsx
✓ loading spinner — ScheduledPaymentForm.tsx + NetWorthClient.tsx — already had spinner, no change
✓ tsc --noEmit — pass, 0 errors

# Sprint D Backend — Investment Portfolio + Event Budget
✓ types — src/types/app.ts — InvestmentHolding|InvestmentDcaPlan|InvestmentPurchase(holding? join)|EventBudget|EventBudgetItem|EventBudgetWithItems|EventBudgetStatus; +expiry_date trên ScheduledPayment
✓ types db — src/types/database.ts — +expiry_date trên ScheduledPaymentRow (Row types Sprint D đã có sẵn)
✓ zod investment — src/lib/validations/investment.ts — createHolding|updateHolding|createDcaPlan|createPurchase|updatePurchase
✓ zod event-budget — src/lib/validations/event-budget.ts — createEventBudget|updateEventBudget|createEventBudgetItem|updateEventBudgetItem
✓ zod scheduled-payment — src/lib/validations/scheduled-payment.ts — +expiry_date optional nullable (update kế thừa qua extend)
✓ query keys — src/lib/queries/queryKeys.ts — investmentHoldings|investmentDcaPlans|investmentPurchases(holdingId?)|eventBudgets|eventBudget
✓ api investments — src/app/api/investments/route.ts (GET+POST) + [id]/route.ts (PUT+DELETE)
✓ api dca — src/app/api/investments/dca/route.ts (GET+POST upsert onConflict household_id,stock_code)
✓ api purchases — src/app/api/investments/purchases/route.ts (GET filter holding_id +POST) + [id]/route.ts (PUT+DELETE)
✓ api event-budgets — src/app/api/event-budgets/route.ts (GET+POST) + [id]/route.ts (GET với items embed+PUT+DELETE)
✓ api event-budget-items — [id]/items/route.ts (POST) + [id]/items/[itemId]/route.ts (PUT+DELETE) — items table không có household_id→guard ownership qua parent event_budget
✓ hook useInvestments — src/lib/hooks/useInvestments.ts — useInvestmentHoldings(CRUD)|useInvestmentDcaPlans(upsert)|useInvestmentPurchases(holdingId? CRUD)
✓ hook useEventBudgets — src/lib/hooks/useEventBudgets.ts — useEventBudgets|useEventBudget(id)|create/update/delete budget|create/update/delete item
DEVIATION: tsc --noEmit không chạy được (sandbox chặn npm/tsc). Cần user verify type-check.

## Event Budget UI
✓ page wrapper — src/app/(app)/event-budgets/page.tsx
✓ loading skeleton — src/app/(app)/event-budgets/loading.tsx (SkeletonList count=5)
✓ list client (table desktop / card mobile, row→detail) — src/components/event-budgets/EventBudgetClient.tsx
✓ create form (Sheet, RHF+Zod, CurrencyInput) — src/components/event-budgets/EventBudgetForm.tsx
✓ item form (Sheet, RHF+Zod) — src/components/event-budgets/EventBudgetItemForm.tsx
✓ detail view (summary+progress+items table/cards+add item) — src/components/event-budgets/EventBudgetDetail.tsx
✓ i18n keys added (status.label, difference, notes, itemName, empty, noItems, usage, common.back) — vi.json/en.json

# Investment Portfolio UI
✓ Investments page — src/app/(app)/investments/page.tsx — server wrapper → InvestmentClient
✓ Investments loading — src/app/(app)/investments/loading.tsx — SkeletonList count=6
✓ InvestmentClient — src/components/investments/InvestmentClient.tsx — 3 tabs (holdings/dca/purchases), table desktop (hidden md:block) / cards mobile (md:hidden), holdings P/L color via text-income/text-expense, DCA active badge, purchases filterable by holding_id Select, FAB-style add buttons min-h-44
✓ HoldingForm — src/components/investments/HoldingForm.tsx — bottom Sheet, RHF+createHoldingSchema, add+edit (uses create/update from useInvestmentHoldings), stock_code uppercased, CurrencyInput for invested/current, textarea notes
✓ PurchaseForm — src/components/investments/PurchaseForm.tsx — bottom Sheet, RHF+createPurchaseSchema, holding_id Select, type=month picker, CurrencyInput budget/price/fees/amount/end_value, number quantity/monthly_return
✓ i18n keys — vi.json + en.json — added editHolding/profitLoss/budget/amount/endValue/monthlyReturn/total/notes/status/active/inactive/selectHolding/allHoldings/noHoldings/empty* keys

# Reports Page Rebuild — Tables + ApexCharts
✓ OverviewTab (NEW) — src/components/reports/OverviewTab.tsx — useMonthlyReport(6); 12-col-ish summary table (Tháng/Thu/Chi/%CT/TK/%TK/CĐ/PS/LP) + area chart (income green/expense red) + savings-rate line chart (#0084DB)
✓ SpendingTab REWRITE — src/components/reports/SpendingTab.tsx — kept 2-level behavior→group logic; desktop Table w/ expandable rows + reused SpendingDonut left of table (grid); mobile accordion cards retained
✓ IncomeTab REWRITE — src/components/reports/IncomeTab.tsx — desktop table (Nguồn/Số tiền/Loại regular|unusual) + horizontal bar chart top-5 sources; mobile cards
✓ BudgetVsActualTab REWRITE — src/components/reports/BudgetVsActualTab.tsx — grouped by costTypeGroup via BUDGET_TEMPLATE name lookup + COST_TYPE_GROUP_LABELS; status thresholds 0-69 safe/70-85 monitor/86-99 warning/100+ over; grouped bar chart budget(blue) vs actual(red)
✓ FundReportTab REWRITE — src/components/reports/FundReportTab.tsx — table (Tên/Loại/Số dư/Mục tiêu/%HT) + horizontal stacked bar (balance + remaining); mobile progress cards
✓ ReportsClient — src/components/reports/ReportsClient.tsx — added "overview" as first+default tab; wired useMonthlyReport
✓ i18n — src/lib/i18n/messages/{vi,en}.json — added 28 reports.* keys (overview/savingsRate/expenseRatio/source/type/regular/unusual/fixed/variable/wasteful/completion/fundType/balance/incomeVsExpense + month/totalIncome/savings/costType/pctOfExpense/pctOfIncome/budgetPct/remaining/usagePct/status/status{Safe,Monitor,Warning,Over})
NOTE: all ApexCharts via dynamic(()=>import("react-apexcharts"),{ssr:false}); charts wrapped rounded-[15px] border bg-card p-4 shadow-panel; amounts formatVND+font-mono tabular-nums; min-h-[44px] on interactive rows. tsc --noEmit clean.

# CSV Transaction Import UI (4-step wizard)
✓ i18n import keys — src/lib/i18n/messages/{vi,en}.json — added import.* (title/uploadCsv/dropHere/rowsParsed/mapColumns/date|amount|debit|credit|descColumn/preview/selected/select|deselectAll/confirm/importing/success/back/next/autoDetected/notMapped/account/auto/step*/single|dualColumn/amountMode/noValidRows/cta)
✓ import hook — src/lib/hooks/useImportTransactions.ts — useMutation POST /api/transactions/import; invalidates keys.transactions(hid, currentMonth) onSuccess; ImportRow + ImportResult types exported
✓ import page wrapper — src/app/(app)/transactions/import/page.tsx — renders ImportClient
✓ ImportClient — src/components/transactions/ImportClient.tsx — 4-step wizard (StepsIndicator + Upload/Mapping/Preview/Confirm sub-components). Upload: drag-drop + file picker, FileReader→parseCsv, autoDetectMapping pre-fills, "Đã đọc X dòng". Mapping: single/dual amount-mode chips, Select per field, auto-detected badge, canMap gate (date + (amount|debit|credit)). Preview: parseDate/parseAmount per row, matchCategory auto-match w/ confidence badge (success≥0.7/warning<0.7), one account Select for all, per-row CategoryPicker override, per-row checkbox (invalid rows disabled+yellow), select/deselect all, "X/Y được chọn". Confirm: summary count + total, mutateAsync w/ try/catch, toast.success→router.push(/transactions).
✓ Import CSV button — src/app/(app)/transactions/page.tsx — added page header row w/ outline "Import CSV" button (Link→/transactions/import) on all 3 states (loading/empty/list)
DEVIATION 1: task said read TransactionsClient.tsx + add button next to "Add transaction" — no TransactionsClient.tsx exists; transactions/page.tsx is the client, "Add transaction" is QuickAddFAB (floating). Added Import button in a new page header instead (FAB kept as-is).
DEVIATION 2: POST /api/transactions/import already existed (per task); not modified. Pre-existing tsc error in that route (is_unusual_income missing — database.ts placeholder tech debt) is unrelated to this task and predates it.
NOTE: tsc --noEmit shows 0 errors in all new/modified files (ImportClient, useImportTransactions, both pages). Only pre-existing route.ts error remains (not touched).

## Debt Management Page Redesign
✓ i18n keys — src/lib/i18n/messages/{vi,en}.json — added settings.debt.{totalOutstanding,monthlyTotal,dtiRatio,activeTab,paidOffTab,creditor,type.label,status.label,actions,progress,markPaidOff,edit}. NOTE: dùng namespace settings.debt.* (không phải debt.*) để khớp convention sẵn có
✓ SortableTableHead — src/components/shared/SortableTableHead.tsx — generic sortable header, chevron up/down/chevrons-up-down
✓ DebtManager redesign — src/components/settings/DebtManager.tsx — MetricCard summary row (outstanding/monthly/DTI), Tabs active/paid, desktop sortable Table + mobile DebtCard, BudgetProgressBar per active row. DTI từ useIncomeSources (current sources). Bỏ FAB → header Add button min-h-[44px]
✓ Page wrapper — src/app/(app)/settings/debt/page.tsx — bỏ h1 trùng (DebtManager có header riêng), p-4 pb-16

# Net Worth Page Redesign
✓ i18n netWorth keys — src/lib/i18n/messages/{vi,en}.json — heroTitle, updatedAt, changeFromLast, accountName, accountType, recordedBalance, difference, saveChanges, systemTotal, recordedTotal, discrepancyTotal, monthlyHistory, month, netWorthAmount, change, noChanges. Interpolation uses {{var}} (matches TranslationProvider).
✓ NetWorthHero — src/components/net-worth/NetWorthHero.tsx — centered large font-mono total, delta arrow (success up/destructive down) from history, updatedAt from snapshot.created_at.
✓ NetWorthDiscrepancyBanner — src/components/net-worth/NetWorthDiscrepancyBanner.tsx — warning banner + 3-col breakdown (Hệ thống|Ghi nhận|Chênh lệch).
✓ NetWorthAccountsTable — src/components/net-worth/NetWorthAccountsTable.tsx — desktop Table w/ SortableTableHead, editable recorded Input (h-11), row border-warning/20 when recorded≠system, sort on all cols via useSortable.
✓ NetWorthFundsTable — src/components/net-worth/NetWorthFundsTable.tsx — read-only fund table w/ FUND_TYPE_CONFIG badge (icon + locale label), sortable.
✓ NetWorthHistoryTable — src/components/net-worth/NetWorthHistoryTable.tsx — month/netWorthAmount/change table below chart, change = recorded[i]-recorded[i-1], default sort month desc, +/- colored.
✓ NetWorthAccountRow mobile — src/components/net-worth/NetWorthAccountRow.tsx — kept card layout, added difference row + border-warning/20 on mismatch.
✓ NetWorthClient rewrite — src/components/net-worth/NetWorthClient.tsx — hero + banner + desktop tables (hidden md:block) / mobile cards (md:hidden), funds section both layouts, history tab chart+table, save button size=lg with changedCount → "Lưu (N thay đổi)" else saveSnapshot. pb-16 added.
  DEVIATION: SortableTableHead prop contract is column:string/sortColumn:string|null/onSort:(string)=>void; useSortable returns keyof T. Cast via headProps object ({sortColumn as string|null, onSort as (string)=>void}) per table to satisfy TS — keys are string-named so runtime-safe.
  DEVIATION: hero delta derived from history (last 2 months total_recorded) since snapshot has no prior-month field; null when <2 months.
  NOTE: useNetWorthHistory items assumed oldest→newest for change calc (matches chart x-axis order).

# Excel Import + Daily Tx Reminder
✓ excel.ts — src/lib/utils/excel.ts — parseExcel(ArrayBuffer)→{headers,rows} matching csv.ts shape; first sheet, header row 1, cellDates, Date→YYYY-MM-DD, number/bool→string, blank header→"Column N". NOTE: requires `npm install xlsx` (blocked by sandbox; user must run). csv.ts untouched.
✓ ImportClient — src/components/transactions/ImportClient.tsx — detectFileType by ext, ArrayBuffer for xlsx/xls + text for csv; accept attr extended; uploadFile key; CSV/Excel Badge next to filename; empty/parse/unsupported toasts.
✓ i18n import keys — vi.json+en.json — import.uploadFile/fileType/unsupportedFile/emptyFile/parseError; dropHere updated to mention Excel.
✓ useTransactionReminder — src/lib/hooks/useTransactionReminder.ts — reuses useTransactions(currentMonth), checks today not present, only after 18:00, dismiss persisted per-day in sessionStorage. NOTE: scoped to currentMonth (default = current); no new API route.
✓ TransactionReminder — src/components/shared/TransactionReminder.tsx — amber banner, bell-ring, animate-page-in, Add now → onAdd, X dismiss, 44px targets.
✓ DashboardClient — src/components/dashboard/DashboardClient.tsx — reminder above MetricCards + own QuickAddSheet instance.
✓ NotificationDropdown — src/components/layout/NotificationDropdown.tsx — Popover bell, red dot when reminder active, list item w/ Add now + dismiss, empty state, own QuickAddSheet.
✓ TopHeader — src/components/layout/TopHeader.tsx — replaced static bell button with NotificationDropdown (desktop actions).

# Sortable Table Columns + AddNew Standardization
✓ useSortable hook — src/lib/hooks/useSortable.ts — generic, none→asc→desc→none toggle, stable sort (index tiebreak), numeric/date/string-aware compareValues, optional defaultSort.
✓ SortableTableHead — src/components/ui/SortableTableHead.tsx — wraps TableHead, lucide:arrow-up-down/arrow-up/arrow-down, props column/sortColumn/sortDirection/onSort/children/className, aria via common.sortBy. Justifies end/center by reading text-right/text-center in className.
✓ i18n common.sortBy — vi.json + en.json — "Sắp xếp theo {{column}}" / "Sort by {{column}}".
✓ TransactionList sort — src/components/transactions/TransactionList.tsx — sort transaction_date + amount (desktop table uses sortedData).
✓ ScheduledPaymentsClient sort — src/components/scheduled-payments/ScheduledPaymentsClient.tsx — sort amount, status, next_due_date.
✓ EventBudgetClient sort — src/components/event-budgets/EventBudgetClient.tsx — sort total_budget + total_actual. NOTE: "remaining" is derived (not a field) → not sortable; task said totalBudget/totalSpent so OK.
✓ InvestmentClient sort — src/components/investments/InvestmentClient.tsx — holdings: weight_pct/total_invested/current_value/profit (profit derived into holdingRows before sort); purchases: purchase_month/amount. DEVIATION: task said "purchaseDate" but field is purchase_month (no purchaseDate exists). Moved data extraction + useSortable above isLoading early-return to satisfy hook rules.
✓ IncomeTab sort — src/components/reports/IncomeTab.tsx — sort amount on IncomeRow; total row stays at TableBody bottom (separate from mapped rows). useSortable placed before rows.length===0 early-return.
✓ FundReportTab sort — src/components/reports/FundReportTab.tsx — sort current_balance + target_amount; trailing total row unaffected.
⚠ BudgetClient / BudgetVsActualTab / SpendingTab — SORT INTENTIONALLY SKIPPED. These are grouped/nested tables (cost-type/behavior parent rows + indented child lines + subtotals). Flat sorting would destroy the grouping hierarchy that is the core of these reports. Flagged rather than guess.
✓ DebtManager AddNew — src/components/settings/DebtManager.tsx — file was already refactored externally (table + its own shared/SortableTableHead, top-right button, no FAB). Fixed title to settings.debt.title + h2 text-lg + Button size="sm" per task spec.
✓ IncomeManager AddNew — src/components/settings/IncomeManager.tsx — replaced FAB with top-right header button (settings.income + settings.income.addIncome, size sm, min-h-[44px] gap-1.5, lucide:plus).
✓ EstimatedExpenseManager AddNew — src/components/settings/EstimatedExpenseManager.tsx — replaced FAB with top-right header button (settings.estimatedExpenses + settings.estimated.addExpense).
✓ AccountsManager — left unchanged; admin-managed, no add button (has adminNote).
✓ i18n settings.debt.title — vi.json + en.json — added (kept existing settings.debt used elsewhere).

⚠ CONFLICT (FLAGGED, not resolved): Two SortableTableHead components now coexist with DIFFERENT APIs:
  - src/components/ui/SortableTableHead.tsx (this task: column/sortColumn/sortDirection/onSort, arrow icons)
  - src/components/shared/SortableTableHead.tsx (created by parallel process: sortKey/activeKey/direction, chevron icons; used by DebtManager)
  Did NOT delete or merge either — needs a decision on which is canonical. DebtManager + my 7 tables use different ones. Recommend consolidating to one.
✓ typecheck — npx tsc --noEmit clean on all touched files (only pre-existing unrelated error: xlsx module in src/lib/utils/excel.ts).

## Batch 1 Spike Admin Style Audit
✓ input.tsx — text-[15px]→text-base (iOS zoom), +motion-reduce:transition-none
✓ CurrencyInput.tsx — text-[15px]→text-base, +motion-reduce:transition-none
✓ select.tsx — SelectTrigger text-[15px]→text-base, +motion-reduce:transition-none
✓ button.tsx — +motion-reduce:transition-none +motion-reduce:hover:translate-y-0
✓ badge.tsx — +motion-reduce:transition-none
✓ skeleton.tsx — +motion-reduce:animate-none
✓ Logo.tsx — fill="#0084DB"→className="fill-primary"
✓ dialog.tsx — shadow rgba literal→shadow-float
✓ alert-dialog.tsx — shadow rgba literal→shadow-float
✓ sheet.tsx — shadow rgba literal→shadow-float, +motion-reduce:transition-none
✓ DueBadge.tsx — rose-500/amber-500 palette→bg-destructive/text-destructive + bg-warning/text-warning (semantic)
✓ MetricCard.tsx — gradient hex from-[#0084DB] to-[#006BB8]/[#004F8A]→from-primary to-primary-hover/primary-pressed
✓ BudgetProgressBar.tsx — track bg-[#e7f0f8]→bg-inset
— SpendingDonut.tsx UNCHANGED: BEHAVIOR_COLORS hex literals required by ApexCharts JS API (cannot use Tailwind tokens); values match design palette
— Overlays bg-black/[0.32] + switch thumb bg-white LEFT: named Tailwind utilities, not hex/rgb literals; standard scrim/thumb

## UI Consistency Pass (PageHeader + Budget-style cards)
✓ Create PageHeader component — src/components/shared/PageHeader.tsx
✓ Add breadcrumb i18n keys — src/lib/i18n/messages/{vi,en}.json (breadcrumb.home, breadcrumb.settings)
✓ ScheduledPayments filter → shadcn Tabs — src/components/scheduled-payments/ScheduledPaymentsClient.tsx — removed unused cn import; table container shadow-card→shadow-panel
✓ Restyle cards/tables to Budget canonical (shadow-panel, border-border, rounded-2xl, overflow-hidden) — dashboard, net-worth, reports/*, settings, shared/MetricCard, funds, transactions/TransactionList
✓ Add PageHeader to clients — DashboardClient, BudgetClient, ReportsClient, NetWorthClient, InvestmentClient, EventBudgetClient, ScheduledPaymentsClient
✓ Add PageHeader to pages — transactions, funds, settings + all settings sub-pages (with breadcrumbs), funds/[id] (dynamic title + breadcrumb), transactions/import
✓ tsc clean (only 2 pre-existing layout.tsx Supabase-relation errors remain, not touched)

Deviations:
- funds/[id]/page.tsx: replaced "Back" link with PageHeader breadcrumb (Funds > fund name); removed now-unused Link import
- transactions/import: PageHeader replaces back-button header; router/useRouter retained (still used for post-import redirect)
- InvestmentClient/EventBudgetClient: card radius left as rounded-[15px] (not in Task 2 file list; only PageHeader added)
