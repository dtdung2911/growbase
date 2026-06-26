SPRINT:S3 AGENT:reviewer STATUS:NEEDS_FIX
CRITICAL:4 WARNING:7 MINOR:5
ISSUES:
  C1:src/app/api/budget/override/route.ts:20-30:budget_overrides upsert missing household_id→DB table requires NOT NULL household_id but route never sends it. Insert will fail with DB constraint error. Fix: add household_id:auth.householdId to upsert payload
  C2:src/app/api/budget/override/route.ts:56-62:budget_overrides DELETE missing household_id filter→.match() only uses budget_baseline_id+month, no household_id. RLS protects at DB level but app should verify ownership explicitly. Fix: add household_id to .match() payload
  C3:src/types/database.ts:187-194:BudgetOverrideRow missing household_id field→DB table has household_id NOT NULL but TypeScript type omits it. Causes type mismatch when inserting. Fix: add `household_id: string` to BudgetOverrideRow
  C4:src/components/budget/BudgetOverrideInput.tsx:62:input has conflicting classes `text-sm text-base`→Tailwind last-wins is unpredictable, input may render at 14px causing iOS zoom. Fix: remove `text-sm`, keep `text-base` only (R7)
  W1:src/components/net-worth/NetWorthAccountRow.tsx:44:input has conflicting classes `text-sm text-base`→same as C4, remove `text-sm`. Demoted to W because secondary input
  W2:src/components/shared/DueBadge.tsx:12-19:hardcoded Vietnamese strings not using i18n→"Qua han X ngay", "Hom nay", "X ngay" should use t() keys. Fix: add scheduledPayments.overdueDays, scheduledPayments.today, scheduledPayments.daysLeft keys to vi.json+en.json
  W3:src/components/reports/SpendingTab.tsx:57,63,71:hardcoded Vietnamese "chi tieu", "thu nhap", "Tong chi"→should use t() keys for i18n compliance. Fix: add reports.ofExpense, reports.ofIncome, reports.totalExpense to messages
  W4:src/components/reports/FundReportTab.tsx:59:hardcoded "Tong quy"→should use t("reports.totalFunds")
  W5:src/components/reports/IncomeTab.tsx:43,62:hardcoded "Thu nhap thuong xuyen", "Thu nhap bat thuong"→should use t() keys
  W6:src/components/scheduled-payments/MarkPaidDialog.tsx:79,86,96,103:hardcoded Vietnamese labels "Tai khoan", "Chon tai khoan", "Danh muc", "Chon danh muc"→should use t() keys
  W7:src/components/net-worth/NetWorthChart.tsx:64:hardcoded `Thang ${label}`→should use t("common.monthLabel", { month: label })
  M1:src/app/api/scheduled-payments/route.ts:11:select("*") on scheduled_payments→prefer explicit column list to avoid leaking future columns
  M2:src/app/api/dashboard/route.ts:38:select("*") on funds→same as M1
  M3:src/app/api/dashboard/route.ts:21:Dashboard uses 3 parallel queries not 4→spec D1 says 4 parallel queries but implementation has 3 (tx+budget+funds). Minor deviation, could combine or add scheduled payments count
  M4:src/lib/hooks/useScheduledPayments.ts:26-33:enrichPayment uses `Record<string, unknown>` + unsafe cast→could type the RPC return more strongly to avoid runtime risk
  M5:src/app/api/scheduled-payments/[id]/route.ts:37:status extracted from raw body bypassing Zod→body.status read outside parsed schema. Should extend Zod schema to include optional status field
APPROVED_IF_ZERO_C:false
GOOD:auth-check-first-all-routes|keys-factory-consistent|skeleton-loading-not-spinner|toast-durations-2s-5s|semantic-tokens-used|min-h-44-on-all-buttons|pb-16-in-AppShell|mark-paid-uses-RPC|no-any-types|CSS-breakpoints-not-JS|ThemeProvider-correct|fund-ops-not-in-S3-scope|Zod-validation-all-POST-PUT
