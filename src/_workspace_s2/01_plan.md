SPRINT:S2 AGENT:planner STATUS:DONE
STORIES:US-3.01|US-3.02|US-3.03|US-3.04|US-3.05|US-4.01|US-4.02|US-4.03|US-4.05

ACs:
  US-3.01:direction_filters_categories|behavior_type_readonly_chip|is_unusual_income_toggle_on_in|submit_optimistic_update|error_keeps_form
  US-3.02:month_filter|client_side_category_filter|empty_state_cta|skeleton_loading
  US-3.03:edit_sheet_prefilled|update_no_reload|delete_confirm_dialog|delete_optimistic
  US-3.04:transfer_creates_2_tx|both_exclude_budget|cc_auto_label|not_in_budget_charts
  US-3.05:debt_category_shows_dropdown|debt_entry_id_saved|behavior_type_debt_repayment_tracking
  US-4.01:total_balance_header|monthly_buffer_release_banner_day1_10|empty_state_cta
  US-4.02:contribute_balance_increases|contribute_not_excluded_budget|contribute_tx_in_list|rpc_fail_rollback
  US-4.03:withdraw_blocked_insufficient|withdraw_balance_decreases|withdraw_excluded_budget
  US-4.05:banner_day1_10_balance_gt0|hide_after_day10|hide_after_release|released_at_set

RULES:BR-CA-001|BR-CA-002|BR-TX-001|BR-TX-002|BR-TX-003|BR-TX-004|BR-TX-005|BR-CO-001|BR-CO-002|BR-CO-003|BR-CO-004|BR-FU-001|BR-FU-002|BR-SY-001|BR-BU-002

BLOCKERS:
  B1=no internal_transfer RPC in 04_TECHNICAL_SPEC→RESOLVED:app-layer creates 2 INSERTs (both exclude_from_budget=true, DB trigger handles exclude flag via set_transaction_behavior_type)
  B2=US-4.05 needs released_at tracking per month not just timestamp→RESOLVED:check released_at month vs current month (released_at in current month=already released)
  B3=fund_contribute RPC needs p_category_id but contribute modal spec has no category picker→RESOLVED:use system "Nạp quỹ" category from savings_investment cost_type (architect must identify/create)
  B4=fund_withdraw RPC needs p_category_id+p_account_id→OK:withdraw form already has category+account fields
  B5=queryKeys.ts missing accounts/incomeSource keys→WARNING:architect adds keys for accounts,debt_entries,fund_transactions

RESOLVED:
  B1→app-layer POST /api/transactions/transfer inserts 2 rows, DB trigger sets exclude_from_budget_report=true for internal_transfer type
  B2→released_at timestamp comparison: extract month+year from released_at vs current date
  B3→architect identifies system category for fund ops or creates one in migration
  S1-carry1→totalAmount field no UI: defer to S4 debt management (US-6.03), not S2 blocker
  S1-carry2→GET /api/household owner-only: S2 does not add member features, defer
  S1-carry3→database.ts placeholder: WARNING, architect should gen types before S2 dev
  S1-carry4→@supabase/ssr version mismatch: WARNING, align in S2 setup

TASKS_DB:
  DB1=migration 007: create get_budget_with_actuals RPC (spec section 6.2, needed by dashboard later but budget tracking needed for fund contribute AC)
  DB2=migration 007: verify set_transaction_behavior_type trigger exists (from 003_functions.sql)
  DB3=migration 007: verify fund_contribute + fund_withdraw RPCs exist (from 003_functions.sql)
  DB4=migration 007: add missing RLS policies for funds, fund_transactions, accounts, debt_entries tables (004_rls.sql only shows transactions pattern)
  DB5=migration 007: ensure system category exists for fund_contribution type (check seed 005)

TASKS_APP:
  APP1=types: Transaction, Fund, FundTransaction, TransferPayload, DebtEntry Zod schemas + TS types
  APP2=queryKeys: add accounts|incomeSource|fundTransactions keys to keys factory
  APP3=lib/hooks: useTransactions(hid,month), useCreateTransaction, useUpdateTransaction, useDeleteTransaction
  APP4=lib/hooks: useTransfer (internal transfer mutation)
  APP5=lib/hooks: useFunds(hid), useFundContribute, useFundWithdraw, useFundRelease
  APP6=lib/hooks: useDebtEntries(hid) (read-only for debt dropdown in tx form)
  APP7=lib/hooks: useAccounts(hid) (read-only for account pickers)
  APP8=API: POST/GET/PUT/DELETE /api/transactions + POST /api/transactions/transfer
  APP9=API: GET/POST /api/funds + POST /api/funds/[id]/contribute + /withdraw + /release
  APP10=API: GET /api/accounts (list active)
  APP11=API: GET /api/debt (list for dropdown)
  APP12=components: CategoryPicker (3-tier: cost_type→group→category, filtered by direction)
  APP13=components: TransactionForm (amount+direction+category+account+date+desc+is_unusual_income+debt_dropdown)
  APP14=components: InternalTransferForm (from_account+to_account+amount+date+note, CC auto-label)
  APP15=components: TransactionItem (icon+color+desc+amount green/red)
  APP16=components: TransactionEditSheet (prefilled form in Sheet)
  APP17=components: QuickAddFAB (desktop=fixed btn, mobile=bottom nav "+")
  APP18=components: FundCard (icon+name+type_badge+balance+progress+months_to_target)
  APP19=components: ContributeModal (amount+date+note, calls RPC)
  APP20=components: WithdrawForm (amount+category+account+desc, validate<=balance)
  APP21=components: MonthlyBufferBanner (day1-10 check, release btn)
  APP22=components: ConfirmDialog (reusable destructive action confirm)
  APP23=components: EmptyState (reusable icon+text+CTA)
  APP24=components: SkeletonLoader patterns (list 6 rows)
  APP25=pages: /transactions/page.tsx (MonthPicker+grouped list+filters+empty+skeleton)
  APP26=pages: /funds/page.tsx (header total+FundCard list+buffer banner+FAB)
  APP27=layout: AppShell with bottom nav (dashboard|transactions|+|funds|more) + MonthPicker in header

TASKS_ORDER:
  1=DB1-DB5 (migrations)
  2=APP1-APP2 (types+keys)
  3=APP8-APP11 (API routes)
  4=APP3-APP7 (hooks)
  5=APP22-APP24 (shared components: ConfirmDialog, EmptyState, Skeleton)
  6=APP12 (CategoryPicker - prerequisite for forms)
  7=APP13-APP14 (transaction forms)
  8=APP15-APP16 (transaction display)
  9=APP17 (QuickAddFAB)
  10=APP18-APP21 (fund components)
  11=APP27 (AppShell layout)
  12=APP25-APP26 (pages)

RISKS:
  R1=get_budget_with_actuals RPC may already be in 003_functions.sql→architect verify before creating
  R2=CategoryPicker needs categories+groups+cost_types joined query→complex component, size L
  R3=MonthPicker exists from S1 (check wizardStore)→reuse or extract to shared
  R4=AppShell bottom nav is new layout paradigm→affects all future pages, design carefully
  R5=Internal transfer form UX: 3 states (normal/CC payment/transfer) in QuickAdd→architect must clarify entry points
  R6=database.ts still placeholder→supabase gen types needed before dev starts
  R7=fund_contribute exclude_from_budget=false in RPC but DB trigger forces true for fund_withdrawal→verify contribute type NOT in trigger exclusion list (checked: trigger only excludes fund_withdrawal+internal_transfer, fund_contribution OK)

KNOWN:
  S1-K1=totalAmount debt field→defer S4
  S1-K2=household API owner-only→defer S2+ if member flow needed
  S1-K3=database.ts placeholder→gen types S2 setup
  S1-K4=supabase version mismatch→fix S2 setup
