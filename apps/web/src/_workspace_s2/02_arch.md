SPRINT:S2 AGENT:architect STATUS:DONE

## DB Layer

MIGRATION:supabase/migrations/007_s2_rls_and_seed_patch.sql
TABLES:none_new (all exist from 002_tables.sql)
RPCS:none_new (fund_contribute+fund_withdraw+get_budget_with_actuals+set_transaction_behavior_type all exist in 003_functions.sql)
RLS:all_complete (004_rls.sql covers transactions+funds+fund_transactions+accounts+debt_entries with own_household CRUD pattern)
TRIGGERS:tx_set_behavior_type:BEFORE_INSERT→sets behavior_type from category+forces exclude_from_budget for fund_withdrawal+internal_transfer (exists 003)

MIGRATION_007_CONTENTS:
  1=VERIFY fund_contribute RPC needs p_category_id→app must resolve system category "Tiết kiệm" (group "Tiết kiệm", cost_type savings_investment) at runtime via lookup query
  2=NO new seed needed→system category "Tiết kiệm" already exists in 005_seed.sql under savings_investment group "Tiết kiệm"
  3=ADD updated_at trigger on transactions (already exists in 003: transactions_set_updated_at)
  4=VERIFY: set_transaction_behavior_type trigger fires on INSERT only (not UPDATE)→UPDATE tx needs app to re-derive behavior_type if category changes

MIGRATION_007_ACTUAL_NEEDS:
  1=ADD set_transaction_behavior_type trigger for UPDATE (currently BEFORE INSERT only→editing tx category won't update behavior_type)
  2=THAT_IS_ALL→no new tables, no new RPCs, no new RLS needed

ORDER:migration_007(trigger_update_fix)→gen_types→app_layer

## App Layer

### TYPES (src/types/database.ts additions)

DB_ROWS_NEEDED:
  TransactionRow:id+household_id+member_id+amount+direction+transaction_type+category_id+account_id+fund_id+debt_entry_id+behavior_type+is_unusual_income+exclude_from_budget_report+description+transaction_date+import_source+created_at+updated_at
  AccountRow:id+household_id+member_id+name+bank_name+account_type+owner_name+is_credit_card+discount_rate+is_active+color+sort_order+created_at
  FundRow:id+household_id+name+fund_type+current_balance+target_amount+monthly_contribution+expected_return_rate+target_date+target_months_expense+reset_monthly+release_trigger+released_at+color+icon+is_active+sort_order+created_at
  FundTransactionRow:id+household_id+fund_id+transaction_type+amount+direction+balance_after+linked_transaction_id+description+transaction_date+is_automatic+created_at
  DebtEntryRow:id+household_id+member_id+creditor_name+debt_type+total_amount+remaining_amount+monthly_payment+interest_rate+start_date+expected_end_date+actual_end_date+status+notes+created_at+updated_at

DB_FUNCTIONS_NEEDED:
  fund_contribute:Args{p_household_id:uuid,p_fund_id:uuid,p_member_id:uuid,p_amount:numeric,p_account_id:uuid,p_category_id:uuid,p_description:text,p_date:date}→Returns:uuid
  fund_withdraw:Args{same_as_contribute}→Returns:uuid
  get_budget_with_actuals:Args{p_household_id:uuid,p_month:text}→Returns:table

### SCHEMAS (src/lib/validations/transaction.ts + fund.ts)

SCHEMAS:
  createTransactionSchema:amount:number.positive()+direction:enum(in|out)+transaction_type:enum(income|expense|debt_repayment).default(expense)+category_id:uuid.required+account_id:uuid.required+description:string.optional+transaction_date:date.default(today)+is_unusual_income:boolean.default(false)+debt_entry_id:uuid.optional
  updateTransactionSchema:same_as_create+id:uuid.required
  createTransferSchema:from_account_id:uuid.required+to_account_id:uuid.required.refine(!=from)+amount:number.positive()+description:string.optional+transaction_date:date.default(today)+is_credit_card_payment:boolean.default(false)
  fundContributeSchema:amount:number.positive()+account_id:uuid.required+description:string.optional+transaction_date:date.default(today)
  fundWithdrawSchema:amount:number.positive().refine(<=balance)+account_id:uuid.required+category_id:uuid.required+description:string.optional+transaction_date:date.default(today)

### QUERY KEYS (src/lib/queries/queryKeys.ts additions)

KEYS_ADD:
  accounts:(hid:string)→["accounts",hid]
  fundTransactions:(hid:string,fundId:string)→["fundTransactions",hid,fundId]
  incomeSource:(hid:string)→["incomeSource",hid]

### HOOKS (src/lib/hooks/)

HOOKS:
  useTransactions:queryKey=keys.transactions(hid,month):GET /api/transactions?month=M:select=join_categories+accounts:invalidates=none
  useCreateTransaction:mutation:POST /api/transactions:invalidates=[keys.transactions(hid,month),keys.budget(hid,month)]
  useUpdateTransaction:mutation:PUT /api/transactions/[id]:invalidates=[keys.transactions(hid,month),keys.budget(hid,month)]
  useDeleteTransaction:mutation:DELETE /api/transactions/[id]:invalidates=[keys.transactions(hid,month),keys.budget(hid,month)]
  useTransfer:mutation:POST /api/transactions/transfer:invalidates=[keys.transactions(hid,month)]
  useAccounts:queryKey=keys.accounts(hid):GET /api/accounts:select=active_only:invalidates=none
  useFunds:queryKey=keys.funds(hid):GET /api/funds:select=active_only:invalidates=none
  useFundContribute:mutation:POST /api/funds/[id]/contribute:invalidates=[keys.funds(hid),keys.transactions(hid,month),keys.fundTransactions(hid,fundId)]
  useFundWithdraw:mutation:POST /api/funds/[id]/withdraw:invalidates=[keys.funds(hid),keys.transactions(hid,month),keys.fundTransactions(hid,fundId)]
  useFundRelease:mutation:POST /api/funds/[id]/release:invalidates=[keys.funds(hid)]
  useDebtEntries:queryKey=keys.debts(hid):GET /api/debt:select=active_for_dropdown:invalidates=none
  useFundTransactions:queryKey=keys.fundTransactions(hid,fundId):GET /api/funds/[id]/transactions:invalidates=none

### API ROUTES

APIS:
  GET /api/transactions?month=YYYY-MM:req={month:query}→res={data:TransactionRow[]+joins}:401|500
  POST /api/transactions:req={createTransactionSchema}→res={data:{id:uuid}}:201|400|401|500
  PUT /api/transactions/[id]:req={updateTransactionSchema}→res={data:{id:uuid}}:200|400|401|403|404|500
  DELETE /api/transactions/[id]:req={}→res={data:{id:uuid}}:200|401|403|404|500
  POST /api/transactions/transfer:req={createTransferSchema}→res={data:{out_id:uuid,in_id:uuid}}:201|400|401|500
  GET /api/accounts:req={}→res={data:AccountRow[]}:200|401|500
  GET /api/funds:req={}→res={data:FundRow[]}:200|401|500
  POST /api/funds/[id]/contribute:req={fundContributeSchema}→res={data:{tx_id:uuid}}:201|400|401|500
  POST /api/funds/[id]/withdraw:req={fundWithdrawSchema}→res={data:{tx_id:uuid}}:201|400|401|500
  POST /api/funds/[id]/release:req={}→res={data:{released_at:timestamptz}}:200|401|404|500
  GET /api/debt:req={}→res={data:DebtEntryRow[]}:200|401|500
  GET /api/funds/[id]/transactions:req={}→res={data:FundTransactionRow[]}:200|401|500
  GET /api/categories:req={}→res={data:CategoryGroupWithCategories[]}:200|401|500

### COMPONENTS

SHADCN_INSTALL_FIRST:sheet+alert-dialog+popover+tabs+separator+skeleton+dialog+dropdown-menu+calendar+scroll-area

COMPONENTS:
  AppShell:Client:renders(BottomNav+TopHeader+MonthPicker+children):src/components/layout/AppShell.tsx
  BottomNav:Client:renders(5_nav_items_with_active_state):src/components/layout/BottomNav.tsx
  TopHeader:Client:renders(month_picker+avatar):src/components/layout/TopHeader.tsx
  ConfirmDialog:Client:renders(AlertDialog_wrapper_for_destructive):src/components/shared/ConfirmDialog.tsx
  EmptyState:Server:renders(icon+title+desc+cta_button):src/components/shared/EmptyState.tsx
  SkeletonList:Server:renders(n_skeleton_rows):src/components/shared/SkeletonList.tsx
  SkeletonCard:Server:renders(skeleton_card_shape):src/components/shared/SkeletonCard.tsx
  CategoryPicker:Client:renders(search+accordion_tree+direction_filter):src/components/transactions/CategoryPicker.tsx
  TransactionForm:Client:renders(direction_toggle+amount+category+account+date+desc+unusual_toggle+behavior_chip):src/components/transactions/TransactionForm.tsx
  InternalTransferForm:Client:renders(from_account+to_account+amount+date+note+cc_toggle):src/components/transactions/InternalTransferForm.tsx
  TransactionItem:Server:renders(category_circle+name+desc+amount+behavior_chip):src/components/transactions/TransactionItem.tsx
  TransactionEditSheet:Client:renders(Sheet+TransactionForm_prefilled):src/components/transactions/TransactionEditSheet.tsx
  TransactionList:Client:renders(grouped_by_date+TransactionItem[]+filter_bar):src/components/transactions/TransactionList.tsx
  QuickAddSheet:Client:renders(Sheet+direction_tabs+TransactionForm|InternalTransferForm):src/components/transactions/QuickAddSheet.tsx
  QuickAddFAB:Client:renders(fixed_button+opens_QuickAddSheet):src/components/transactions/QuickAddFAB.tsx
  FilterBar:Client:renders(category+account+type_dropdowns):src/components/transactions/FilterBar.tsx
  FundCard:Client:renders(icon+name+type_badge+progress+balance+buttons):src/components/funds/FundCard.tsx
  ContributeModal:Client:renders(Dialog+amount+account+date+note):src/components/funds/ContributeModal.tsx
  WithdrawForm:Client:renders(amount+category+account+desc+balance_check):src/components/funds/WithdrawForm.tsx
  MonthlyBufferBanner:Client:renders(conditional_banner+release_button):src/components/funds/MonthlyBufferBanner.tsx
  FundList:Client:renders(FundCard[]+total_header):src/components/funds/FundList.tsx

### PAGES

PAGES:
  /(app)/transactions/page.tsx:auth_gate=middleware:data_source=useTransactions(hid,month)+client_filter:renders=TopHeader+FilterBar+TransactionList+QuickAddFAB+EmptyState
  /(app)/funds/page.tsx:auth_gate=middleware:data_source=useFunds(hid):renders=TopHeader+FundList+MonthlyBufferBanner+QuickAddFAB+EmptyState
  /(app)/layout.tsx:auth_gate=middleware:data_source=useHousehold:renders=AppShell(BottomNav+TopHeader+children)

ROUTE_GROUPS:
  (app)=authenticated_layout_with_AppShell:contains=transactions+funds+dashboard+reports+settings
  NOTE:existing /setup and /login stay outside (app) group

### DATA FLOWS

DATA_FLOW_CREATE_TX:user_taps_FAB→QuickAddSheet_opens→direction_toggle→TransactionForm→submit→useCreateTransaction.mutate→POST /api/transactions→supabase.insert→trigger_sets_behavior_type→invalidate(transactions+budget)→toast_success→sheet_closes
DATA_FLOW_TRANSFER:user_selects_transfer_tab→InternalTransferForm→submit→useTransfer.mutate→POST /api/transactions/transfer→2x_supabase.insert(type=internal_transfer)→trigger_sets_exclude=true→invalidate(transactions)→toast
DATA_FLOW_FUND_CONTRIBUTE:user_taps_nap_quy→ContributeModal→submit→useFundContribute.mutate→POST /api/funds/[id]/contribute→supabase.rpc(fund_contribute)→invalidate(funds+transactions+fundTransactions)→toast
DATA_FLOW_FUND_WITHDRAW:user_taps_rut_quy→WithdrawForm→validate(amount<=balance)→useFundWithdraw.mutate→POST /api/funds/[id]/withdraw→supabase.rpc(fund_withdraw)→invalidate(funds+transactions+fundTransactions)→toast
DATA_FLOW_BUFFER_RELEASE:MonthlyBufferBanner→user_confirms→useFundRelease.mutate→POST /api/funds/[id]/release→update funds.released_at=now()→invalidate(funds)→banner_hides
DATA_FLOW_EDIT_TX:user_taps_TransactionItem→TransactionEditSheet_opens(prefilled)→edit→useUpdateTransaction.mutate→PUT /api/transactions/[id]→invalidate→toast→sheet_closes
DATA_FLOW_DELETE_TX:user_taps_delete→ConfirmDialog→confirm→useDeleteTransaction.mutate→DELETE /api/transactions/[id]→invalidate→toast

## Decisions

D1=internal_transfer_no_rpc→app_creates_2_INSERTs:spec has no internal_transfer RPC+planner confirmed B1+trigger handles exclude_from_budget. Both rows inserted in single API route (not truly atomic but acceptable—partial fail = API returns error, no fund balance involved)
D2=fund_contribute_category→runtime_lookup_system_category "Tiết kiệm":seed 005 already creates system category under savings_investment group "Tiết kiệm". API route queries category by name+is_system=true at call time. No new seed needed
D3=category_picker_data→reuse_existing_useCategories_hook:already fetches groups→categories tree. Add direction filter in component (cost_type income→direction in, others→out). cost_type_id join needed
D4=behavior_type_on_UPDATE→add_trigger:003 only has BEFORE INSERT trigger. Editing tx category_id won't update behavior_type. Migration 007 adds BEFORE UPDATE trigger with same fn
D5=transfer_cc_auto_label→app_sets_description "Thanh toán thẻ tín dụng [account_name]":when is_credit_card_payment=true, app prepends label. No DB change needed
D6=monthly_buffer_release→simple_UPDATE_released_at:no RPC needed (no balance change). API route UPDATEs funds.released_at=now() WHERE fund_type=monthly_buffer. Banner checks: day 1-10 AND balance>0 AND (released_at IS NULL OR extract(month from released_at)!=current_month)
D7=route_group_(app)→all_post-onboarding_pages_share_AppShell_layout:transactions+funds+dashboard+reports+settings all inside (app)/ route group with shared layout.tsx containing AppShell
D8=transaction_list_grouping→client_side:supabase returns flat list sorted by date DESC. Client groups by date string. No server-side grouping needed (single month = max ~200 txns)
D9=database.ts→manual_Row_types_for_S2:gen types ideal but placeholder pattern established in S1. Add Row types manually. Note for S3: run supabase gen types to replace
D10=filter_bar→client_side_filtering:transaction list filtered client-side by category/account/direction. No server query params beyond month. Keeps API simple
D11=categories_api→new_GET_/api/categories_route:useCategories hook currently queries supabase directly from client. For consistency+auth pattern, add API route. But D-override: keep direct supabase query (established S1 pattern, saves 1 API route, RLS handles auth). No new route
D12=fund_withdraw_direction→spec says direction='out' in RPC:but withdraw puts money INTO account (direction=in from account perspective). Spec explicitly sets direction='out' in RPC. Follow spec literally—direction represents fund perspective (money flows OUT of fund)
D13=QuickAddSheet_entry_points→single_Sheet_with_3_tabs(expense|income|transfer):FAB opens sheet. Tab selection determines form. No separate entry points. Mobile: bottom sheet via Sheet component

## Risks

R1=trigger_update_behavior_type→if 007 migration fails, editing tx category won't sync behavior_type. Mitigation: API route can set behavior_type explicitly on UPDATE as fallback
R2=system_category_lookup_by_name→fragile if seed changes category name. Mitigation: lookup by cost_type code + is_system=true + group name as secondary filter. Consider adding code field to categories table in future
R3=internal_transfer_not_atomic→2 INSERTs can partially fail. Mitigation: wrap in supabase transaction (begin/commit) or accept risk (no balance tracking for transfers, orphaned row deletable)
R4=database.ts_manual_types→drift from actual schema. Mitigation: run supabase gen types in S3 setup, replace entire file
R5=MonthPicker_shared_state→wizardStore has MonthPicker logic from S1. Must extract to appStore.currentMonth (already exists). Verify no import conflicts
R6=shadcn_components_needed→Sheet+AlertDialog+Popover+Dialog+Calendar+Skeleton+Tabs+ScrollArea not yet installed. Must npx shadcn-ui add before dev starts
R7=fund_contribute_RPC_SECURITY_DEFINER→bypasses RLS. Auth guard already exists in 003 (checks get_user_household_ids()). Verified safe

OK:src/_workspace/02_arch.md
MOD:none
ISSUES:none
SKIP:none
KNOWN:S1-K3=database.ts placeholder→D9 manual types|S1-K4=supabase version mismatch→dev setup task
NEXT:ready→gb-migration(007)+gb-developer(app_layer)
