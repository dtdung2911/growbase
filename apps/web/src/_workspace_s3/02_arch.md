SPRINT:S3 AGENT:architect STATUS:DONE

## DB Layer

MIGRATION:supabase/migrations/008_s3_system_balances.sql
TABLES:none_new(all_S3_tables_exist_in_002:budget_overrides|net_worth_snapshots|scheduled_payments|estimated_expenses)
RPCS:
  get_system_balances(p_household_id:uuid)→TABLE(account_id:uuid,account_name:text,account_type:text,system_balance:numeric):sum_tx_per_account(in-out)_for_net_worth_system_estimate
  mark_payment_paid(p_payment_id:uuid,p_household_id:uuid,p_create_transaction:bool,p_account_id:uuid,p_category_id:uuid,p_member_id:uuid,p_date:date)→uuid:advance_next_due_date+optionally_insert_transaction. SECURITY_DEFINER+auth_guard
RLS:all_S3_tables_already_have_full_CRUD_in_004_rls.sql(verified)
TRIGGERS:none_new(behavior_type+exclude_from_budget triggers already in 003)
ORDER:get_system_balances→mark_payment_paid(independent,no_ordering_needed)

EXISTING_DB_VERIFIED:
  get_budget_with_actuals(p_household_id,p_month)→already_handles_budget_overrides_via_LEFT_JOIN
  net_worth_snapshots→UNIQUE(household_id,snapshot_month)+discrepancy_GENERATED_ALWAYS
  scheduled_payments→status_CHECK('active','cancelled','expired')+next_due_date+period
  budget_overrides→UNIQUE(budget_baseline_id,month)

RPC_DETAIL_get_system_balances:
  SELECT a.id, a.name, a.account_type,
    COALESCE(SUM(CASE t.direction WHEN 'in' THEN t.amount ELSE -t.amount END), 0) AS system_balance
  FROM accounts a
  LEFT JOIN transactions t ON t.account_id = a.id AND t.household_id = p_household_id
  WHERE a.household_id = p_household_id AND a.is_active = true
  GROUP BY a.id, a.name, a.account_type
  LANGUAGE:plpgsql SECURITY_DEFINER(needs_auth_guard:verify_auth.uid()_in_household)

RPC_DETAIL_mark_payment_paid:
  1. auth_guard: verify auth.uid() is member of p_household_id
  2. SELECT sp.* FROM scheduled_payments WHERE id=p_payment_id AND household_id=p_household_id FOR UPDATE
  3. IF NOT FOUND → RAISE 'Payment not found'
  4. IF sp.status != 'active' → RAISE 'Payment not active'
  5. advance_next_due_date:
     monthly → + interval '1 month'
     quarterly → + interval '3 months'
     yearly → + interval '1 year'
  6. UPDATE scheduled_payments SET next_due_date = new_date WHERE id = p_payment_id
  7. IF p_create_transaction = true:
     INSERT INTO transactions(household_id,member_id,amount,direction,transaction_type,category_id,account_id,description,transaction_date)
     VALUES(p_household_id,p_member_id,sp.amount,'out','expense',p_category_id,p_account_id,'Thanh toan '||sp.name,p_date)
     RETURN tx_id
  8. ELSE RETURN p_payment_id

DATABASE_TYPES_UPDATE:
  database.ts needs S3 rows: NetWorthSnapshotRow|ScheduledPaymentRow|BudgetOverrideRow|EstimatedExpenseRow
  database.ts Functions: add get_system_balances + mark_payment_paid signatures

## App Layer

DEPS_INSTALL:next-themes|next-intl(NOT_INSTALLED_YET)

INFRA_SETUP:
  next-themes:
    providers.tsx→wrap_with_ThemeProvider(attribute="class",defaultTheme="light",storageKey="growbase-theme")
    html_tag→suppressHydrationWarning(already_set)
    darkMode:["class"]→already_in_tailwind.config.ts
  next-intl:
    DECISION→lightweight_custom_i18n_instead(see_Decisions)
    src/lib/i18n/t.ts→useTranslation_hook+getTranslation_fn
    src/messages/vi.json+en.json→namespace_keys_per_style_guide_sec12
    scope:S3_components_only. S1/S2_retrofit_deferred

SCHEMAS:
  scheduledPaymentCreate:name:required_min1|period:enum(monthly,quarterly,yearly)|amount:positive_number|payment_method:optional_string|next_due_date:date_required|notes:optional_string
  scheduledPaymentUpdate:extends_create+id:uuid_required+status:enum(active,cancelled,expired)
  markPaidForm:create_transaction:boolean|account_id:optional_uuid(required_if_create_tx)|category_id:optional_uuid(required_if_create_tx)|date:optional_date_default_today
  netWorthSnapshot:items:array_of{account_id:uuid,balance_recorded:number}|notes:optional_string
  budgetOverride:budget_baseline_id:uuid_required|month:date_first_of_month|override_pct:number_0_to_100

TYPES_NEW:
  ScheduledPayment→from_DB_row+computed(days_until_due,urgency_level)
  NetWorthSnapshot→from_DB_row
  NetWorthItem→{account_id,account_name,type,balance_recorded,balance_system}
  BudgetActualLine→from_get_budget_with_actuals_return
  BudgetOverride→from_DB_row
  SystemBalance→{account_id,account_name,account_type,system_balance}
  DashboardData→{totalIncome,totalExpense,savingsRate,spendingByBehavior,budgetLines,funds,recentTransactions}

QUERY_KEYS_ADD:
  scheduledPayments:(hid:string)→["scheduledPayments",hid]
  netWorth:(hid:string,month:string)→["netWorth",hid,month]
  netWorthHistory:(hid:string)→["netWorthHistory",hid]
  budgetActuals:(hid:string,month:string)→["budgetActuals",hid,month]
  budgetOverrides:(hid:string,month:string)→["budgetOverrides",hid,month]
  dashboard:(hid:string,month:string)→["dashboard",hid,month]
  systemBalances:(hid:string)→["systemBalances",hid]

HOOKS:
  useDashboardData:queryKey=keys.dashboard(hid,month):GET /api/dashboard?month=M:invalidates=none(read_only)
  useBudgetActuals:queryKey=keys.budgetActuals(hid,month):GET /api/budget?month=M:invalidates=none
  useBudgetOverrideMutation:queryKey=none(mutation):POST /api/budget/override:invalidates=[keys.budgetActuals,keys.budget,keys.dashboard]
  useDeleteBudgetOverride:mutation:DELETE /api/budget/override:invalidates=[keys.budgetActuals,keys.budget,keys.dashboard]
  useScheduledPayments:queryKey=keys.scheduledPayments(hid):GET /api/scheduled-payments:invalidates=none
  useCreateScheduledPayment:mutation:POST /api/scheduled-payments:invalidates=[keys.scheduledPayments]
  useUpdateScheduledPayment:mutation:PUT /api/scheduled-payments/[id]:invalidates=[keys.scheduledPayments]
  useMarkPaymentPaid:mutation:POST /api/scheduled-payments/[id]/mark-paid:invalidates=[keys.scheduledPayments,keys.transactions,keys.dashboard]
  useNetWorthSnapshot:queryKey=keys.netWorth(hid,month):GET /api/net-worth?month=M:invalidates=none
  useNetWorthHistory:queryKey=keys.netWorthHistory(hid):GET /api/net-worth/history:invalidates=none
  useUpsertNetWorth:mutation:POST /api/net-worth:invalidates=[keys.netWorth,keys.netWorthHistory]
  useSystemBalances:queryKey=keys.systemBalances(hid):RPC get_system_balances:invalidates=none

APIS:
  GET /api/dashboard?month=YYYY-MM:none→DashboardData:401|400
    impl:Promise.all([transactions_query,rpc_get_budget_with_actuals,funds_query,income_query])
    transform:compute_totalIncome|totalExpense|savingsRate|spendingByBehavior_from_transactions_in_memory
    target:<800ms_via_4_parallel_queries(no_single_aggregate_RPC_needed)
  GET /api/budget?month=YYYY-MM:none→BudgetActualLine[]:401|400
    impl:rpc_get_budget_with_actuals(already_handles_overrides)
  POST /api/budget/override:{budget_baseline_id,month,override_pct}→BudgetOverride:401|400|409
    impl:supabase.from('budget_overrides').upsert(ON_CONFLICT_budget_baseline_id+month)
  DELETE /api/budget/override:{budget_baseline_id,month}→void:401|400|404
    impl:supabase.from('budget_overrides').delete().match({budget_baseline_id,month})
  GET /api/scheduled-payments:none→ScheduledPayment[]:401
    impl:supabase.from('scheduled_payments').select('*').eq('household_id',hid).order('next_due_date')
  POST /api/scheduled-payments:{name,period,amount,payment_method?,next_due_date,notes?}→ScheduledPayment:401|400
  PUT /api/scheduled-payments/[id]:{name?,period?,amount?,payment_method?,next_due_date?,status?,notes?}→ScheduledPayment:401|400|404
  DELETE /api/scheduled-payments/[id]:none→void:401|404
  POST /api/scheduled-payments/[id]/mark-paid:{create_transaction,account_id?,category_id?,member_id?,date?}→{payment_id,tx_id?}:401|400|404
    impl:rpc_mark_payment_paid
  GET /api/net-worth?month=YYYY-MM:none→NetWorthSnapshot(+system_balances_merged):401|400
    impl:parallel[supabase.from('net_worth_snapshots').select('*').match({hid,snapshot_month}), rpc_get_system_balances]
    merge:items_array_from_snapshot + system_balance_per_account + fund_balances(read_only)
  POST /api/net-worth:{snapshot_month,items,total_recorded,total_system,notes?}→NetWorthSnapshot:401|400
    impl:supabase.from('net_worth_snapshots').upsert(ON_CONFLICT_household_id+snapshot_month)
  GET /api/net-worth/history:none→NetWorthSnapshot[]:401
    impl:supabase.from('net_worth_snapshots').select('snapshot_month,total_recorded,total_system,discrepancy').eq('household_id',hid).order('snapshot_month')

COMPONENTS:
  AppShell:Client:responsive_shell(DesktopDrawer_>=1024+BottomNav_<1024+TopHeader_mobile)
  DesktopDrawer:Client:left_sidebar_w-60_with_nav_items+logo+user_section
  BottomNav:Client:REFACTOR→add_budget+net-worth+scheduled-payments_to_desktop_drawer_only. Mobile_keeps_5_items(dashboard|transactions|+FAB|funds|more_menu)
  TopHeader:Client:MonthPicker(already_exists)+avatar_icon_right
  DashboardPage:Server→DashboardClient:Client:renders_all_dashboard_sections
  MetricCard:Client:label+amount+trend_arrow
  SpendingDonut:Client:Recharts_PieChart_3_segments(fixed|variable|wasteful)
  BudgetProgressBar:Client:progress_bar_with_safe|warning|danger_colors
  FundOverviewCard:Client:mini_fund_card_for_dashboard
  RecentTransactionsList:Client:5_items+xem_tat_ca_link
  MonthlyBufferBanner:Client:conditional_banner_for_monthly_buffer_fund
  BudgetPage:Server→BudgetClient:Client:expandable_budget_groups+inline_override_edit
  BudgetGroupRow:Client:accordion_row+progress_bar+expand_to_transactions
  BudgetOverrideInput:Client:inline_%_edit_for_single_month
  NetWorthPage:Server→NetWorthClient:Client:account_list+actual_inputs+discrepancy
  NetWorthAccountRow:Client:system_balance_display+actual_balance_input
  NetWorthChart:Client:Recharts_LineChart_monthly_trend
  ScheduledPaymentsPage:Server→ScheduledPaymentsClient:Client:list+form
  PaymentCard:Client:payment_info+due_badge+actions
  DueBadge:Client:red_<=7d|orange_<=30d|none_>30d
  MarkPaidDialog:Client:confirm+optional_tx_form
  ScheduledPaymentForm:Client:RHF+Zod_create/edit_form
  ReportsPage:Server→ReportsClient:Client:4_tabs(spending|income|budget_vs_actual|funds)
  SpendingTab:Client:table_by_group+amount+%income
  IncomeTab:Client:regular+unusual_split
  BudgetVsActualTab:Client:table+status_indicators
  FundReportTab:Client:monthly_fund_activity_table
  NavBadge:Client:due_soon_count_badge_on_nav_item

PAGES:
  /dashboard:auth_gate(middleware):useDashboardData(parallel_4_queries_via_api)
  /budget:auth_gate:useBudgetActuals+useTransactions(for_expanded_group)
  /net-worth:auth_gate:useNetWorthSnapshot+useSystemBalances+useFunds
  /net-worth/history:auth_gate:useNetWorthHistory(NEW_PAGE_or_tab_in_net-worth)
  /scheduled-payments:auth_gate:useScheduledPayments
  /reports:auth_gate:useBudgetActuals+useTransactions+useFunds(per_active_tab)

DATA_FLOW:
  dashboard:page_load→useDashboardData→GET /api/dashboard→4_parallel_supabase_queries→aggregate_in_route→return_DashboardData→render_sections
  budget_override:click_pencil→BudgetOverrideInput→useBudgetOverrideMutation→POST /api/budget/override→upsert_budget_overrides→invalidate[budgetActuals,dashboard]→rerender
  mark_paid:click_paid_btn→MarkPaidDialog→useMarkPaymentPaid→POST /api/scheduled-payments/[id]/mark-paid→rpc_mark_payment_paid→invalidate[scheduledPayments,transactions,dashboard]→toast
  net_worth_save:fill_inputs→useUpsertNetWorth→POST /api/net-worth→upsert_net_worth_snapshots→invalidate[netWorth,netWorthHistory]→toast

APPSHELL_REFACTOR:
  current:max-w-md+BottomNav_only→mobile_only_layout
  target:responsive_shell
  mobile(<1024):BottomNav(5_items:dashboard|transactions|+FAB|funds|more)+TopHeader+max-w-md_content
  desktop(>=1024):DesktopDrawer(w-60,all_nav_items)+TopHeader(no_MonthPicker,moved_to_page_level)+pl-60_content+max-w-5xl
  "more"_menu_on_mobile:bottom_sheet_with[reports|budget|net-worth|scheduled-payments|settings]
  implementation:useMediaQuery(1024px)_or_CSS_breakpoint(lg:)_+_conditional_render
  DECISION:CSS_breakpoint_preferred(no_JS_hydration_mismatch)→hidden_lg:block_for_drawer,lg:hidden_for_bottom_nav

I18N_SETUP:
  lightweight_custom_solution(NOT_next-intl):
    src/lib/i18n/messages/vi.json
    src/lib/i18n/messages/en.json
    src/lib/i18n/useTranslation.ts→hook_returns_t(key)_fn
    src/lib/i18n/TranslationProvider.tsx→context_provider
  scope:S3_strings_only(nav|dashboard|budget|net-worth|scheduled-payments|reports|common)
  S1/S2_pages_retrofit_deferred_to_S4

THEME_SETUP:
  ALREADY_DONE:tailwind.config(darkMode:class)+globals.css(light+dark_vars)+semantic_tokens(surface|elevated|inset)+copper_brand_colors
  TODO:install_next-themes→ThemeProvider_in_providers.tsx→Settings_toggle
  existing_components_already_use_semantic_tokens(bg-background,text-foreground,bg-card)→no_retrofit_needed

## Decisions

D1:dashboard_800ms→parallel_4_queries_in_single_API_route(not_single_aggregate_RPC):reason=RPC_would_duplicate_get_budget_with_actuals_logic+4_simple_queries_in_Promise.all_fast_enough_with_connection_pooling+simpler_to_maintain
D2:net_worth_system_balance→new_RPC_get_system_balances(sum_tx_per_account):reason=BR-CO-004_says_no_auto_account_balance_but_system_needs_estimate_for_discrepancy_calc+fund_balances_reliable_from_funds.current_balance+account_balances_derived_from_tx_sum_only
D3:i18n→lightweight_custom_dict_NOT_next-intl:reason=next-intl_requires_middleware+routing_changes(locale_prefix)+heavy_for_2_languages+custom_solution=100_lines_with_React_context+JSON_dicts+type-safe_keys. Revisit_if_3rd_language_added
D4:AppShell_responsive→CSS_breakpoint_not_useMediaQuery:reason=avoids_SSR/hydration_mismatch+simpler+Tailwind_lg:_prefix_handles_it
D5:mobile_nav→"more"_menu_as_5th_item_instead_of_squeezing_7_items:reason=375px_can_fit_5_items_comfortably(style_guide_sec5_shows_5_items)+desktop_drawer_shows_all_7+more_opens_sheet_with_remaining_items
D6:mark_paid→atomic_RPC(mark_payment_paid)_not_sequential_API_calls:reason=advance_date+optional_tx_must_be_atomic+SECURITY_DEFINER_needs_auth_guard
D7:net_worth_history→sub_route_/net-worth_with_tab_not_separate_page:reason=simpler_routing+chart_is_small+one_fewer_page_to_maintain
D8:budget_override→upsert_pattern:reason=UNIQUE(budget_baseline_id,month)_in_schema+user_may_edit_same_month_multiple_times
D9:theme_default→light:reason=style_guide_sec11_says_light_default+existing_globals.css_already_has_:root=light+.dark=dark

## Risks

R1:dashboard_800ms→4_parallel_queries_may_exceed_under_cold_start:mitigation=staleTime:60s_means_cached_on_revisit+skeleton_loading_hides_latency+can_add_GET_/api/dashboard_caching_header_later
R2:AppShell_refactor→touches_all_existing_pages_layout:mitigation=pb-16_already_on_main+desktop_adds_pl-60+CSS_breakpoint_means_mobile_layout_unchanged
R3:net_worth_system_balance_inaccuracy→tx_sum_per_account_doesnt_account_for_initial_balances:mitigation=discrepancy_column_exists_for_this_exact_purpose+user_enters_actual_balance+system_is_just_reference
R4:i18n_custom_solution_may_lack_features(plural,interpolation):mitigation=Vietnamese_has_no_plural+simple_{{var}}_interpolation_sufficient_for_MVP+can_migrate_to_next-intl_later
R5:budget_override_inline_edit_on_375px:mitigation=use_full_width_input_in_expanded_row+confirm/cancel_as_icon_buttons_not_text
R6:scheduled_payment_mark_paid_creates_tx_without_fund_link:mitigation=mark_paid_tx_is_regular_expense_not_fund_op+category_determines_behavior_type_via_trigger+no_fund_link_needed
