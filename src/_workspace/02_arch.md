SPRINT:S4 AGENT:architect STATUS:DONE

## DB Layer

MIGRATION:supabase/migrations/009_s4_budget_baselines_list.sql
DESCRIPTION:Add GET baselines RPC (budget settings needs list of baselines, not actuals). No new tables needed — all tables exist in 002_tables.sql. recalculate_debt_budget + trigger already deployed in 003_functions.sql (line 168-215, verified). estimated_expenses table exists (002_tables.sql line 263). income_sources SCD Type 2 schema exists (002_tables.sql line 46).

TABLES:none_needed(all_17_tables_exist_in_002_tables.sql)

RPCS:
  get_budget_baselines(p_household_id:uuid)→TABLE(id,name,description,budget_pct,is_system,is_auto_calculated,auto_calculated_source,linked_category_group_ids,sort_order):returns_all_baselines_for_household_ordered_by_sort_order
  NOTE:recalculate_debt_budget(p_household_id:uuid)→void:ALREADY_EXISTS_003_functions.sql_line168
  NOTE:trigger_recalculate_debt_budget→ALREADY_EXISTS_on_debt_entries_INSERT/UPDATE/DELETE

RLS:all_covered_in_004_rls.sql(130_policies_deployed)|no_new_policies_needed

TRIGGERS:none_new(debt_budget_recalc_already_on_debt_entries|set_transaction_behavior_type_already_on_transactions)

ORDER:
  1.create_get_budget_baselines_RPC(009_migration)
  2.verify_all_existing_functions_intact(no_changes_to_003)

NEW_RPC_SPEC:
```sql
CREATE OR REPLACE FUNCTION get_budget_baselines(p_household_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  budget_pct numeric,
  is_system bool,
  is_auto_calculated bool,
  auto_calculated_source text,
  linked_category_group_ids uuid[],
  sort_order int
) AS $$
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;
  RETURN QUERY
  SELECT bb.id, bb.name, bb.description, bb.budget_pct, bb.is_system,
         bb.is_auto_calculated, bb.auto_calculated_source,
         bb.linked_category_group_ids, bb.sort_order
  FROM budget_baselines bb
  WHERE bb.household_id = p_household_id
  ORDER BY bb.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
```

## App Layer

### Query Keys (add to src/lib/queries/queryKeys.ts)
ADD_KEYS:
  estimatedExpenses:(hid:string)→["estimatedExpenses",hid]
  members:(hid:string)→["members",hid]
  invitations:(hid:string)→["invitations",hid]
  budgetBaselines:(hid:string)→["budgetBaselines",hid]
  incomeSources:(hid:string)→["incomeSources",hid]
NOTE:incomeSource_key_exists_but_singular→rename_to_incomeSources_or_add_separate
DECISION:add_incomeSources_keep_old_incomeSource_for_backward_compat

### Zod Schemas (new files: src/lib/validations/)

SCHEMAS:
  category.ts:
    createCategorySchema:name:string_min1_max100,group_id:uuid,default_behavior_type:enum(fixed|variable|wasteful|debt_repayment|savings_investment),icon:string_optional
    updateCategorySchema:name:string_min1_max100_optional,icon:string_optional,is_active:boolean_optional
  debt.ts:
    createDebtSchema:creditor_name:string_min1,debt_type:enum(bank_loan|credit_card|mortgage|personal),total_amount:number_positive,remaining_amount:number_optional,monthly_payment:number_positive,interest_rate:number_optional_0_100,start_date:string_optional,expected_end_date:string_optional,member_id:uuid_optional,notes:string_optional
    updateDebtSchema:partial_of_createDebtSchema
    paidOffDebtSchema:id:uuid
  estimated-expense.ts:
    createEstimatedExpenseSchema:name:string_min1,category_id:uuid_optional,linked_fund_id:uuid_optional,estimated_amount:number_positive,target_date:string_optional,notes:string_optional
    updateEstimatedExpenseSchema:name_optional,estimated_amount_optional,actual_amount_optional_nullable,status:enum(planned|completed|cancelled)_optional,target_date_optional,notes_optional
  income-source.ts:
    createIncomeSourceSchema:source_name:string_min1,monthly_amount:number_positive,member_id:uuid_optional
    updateIncomeSourceSchema:monthly_amount:number_positive(SCD_Type2→new_record)
  member.ts:
    inviteMemberSchema:email:string_email,display_name:string_min1,role:enum(member|viewer)_default_member
  account-settings.ts:
    updateAccountSchema:name:string_min1_optional,bank_name:string_optional,account_type:enum_optional,owner_name:string_optional,is_credit_card:boolean_optional,color:string_optional
  household-settings.ts:
    updateHouseholdSchema:name:string_min1_max100,currency:enum(VND|USD)_optional
  budget-baseline.ts:
    updateBaselinePctSchema:id:uuid,budget_pct:number_0_100
    createCustomBaselineSchema:name:string_min1,budget_pct:number_0_100,linked_category_group_ids:uuid_array_optional,description:string_optional
    deleteCustomBaselineSchema:id:uuid
    batchUpdateBaselinesSchema:baselines:array_of_{id:uuid,budget_pct:number_0_100}

### TypeScript Types (add to src/types/app.ts)
ADD_TYPES:
  IncomeSource:{id,household_id,member_id,source_name,monthly_amount,effective_from,effective_to,is_current,created_at}
  Member:{id,household_id,user_id,display_name,role,joined_at,is_active}
  Invitation:{id,household_id,email,display_name,role,token,status,expires_at,created_at}
  EstimatedExpense:{id,household_id,name,category_id,linked_fund_id,estimated_amount,actual_amount,target_date,status,notes,created_at}
  BudgetBaseline:{id,household_id,name,description,budget_pct,is_system,is_auto_calculated,auto_calculated_source,linked_category_group_ids,sort_order}
  NOTE:DebtEntry_exists_but_needs_expansion(+interest_rate,start_date,expected_end_date,actual_end_date,member_id,notes)
  NOTE:Account_exists_already

### Hooks (src/lib/hooks/)

HOOKS:
  useCategoryMutations.ts:
    useCreateCategory:queryKey:none:endpoint:POST_/api/categories:invalidates:[categories(hid)]
    useUpdateCategory:queryKey:none:endpoint:PUT_/api/categories/[id]:invalidates:[categories(hid)]
    useDeleteCategory:queryKey:none:endpoint:DELETE_/api/categories/[id]:invalidates:[categories(hid)]

  useDebtMutations.ts:
    useCreateDebt:queryKey:none:endpoint:POST_/api/debt:invalidates:[debts(hid),budgetBaselines(hid),budgetActuals(hid,month)]
    useUpdateDebt:queryKey:none:endpoint:PUT_/api/debt/[id]:invalidates:[debts(hid),budgetBaselines(hid)]
    usePaidOffDebt:queryKey:none:endpoint:PATCH_/api/debt/[id]/paid-off:invalidates:[debts(hid),budgetBaselines(hid),budgetActuals(hid,month)]

  useEstimatedExpenses.ts:
    useEstimatedExpenses:queryKey:estimatedExpenses(hid):endpoint:GET_/api/estimated-expenses:invalidates:none
    useCreateEstimatedExpense:endpoint:POST_/api/estimated-expenses:invalidates:[estimatedExpenses(hid)]
    useUpdateEstimatedExpense:endpoint:PUT_/api/estimated-expenses/[id]:invalidates:[estimatedExpenses(hid)]
    useDeleteEstimatedExpense:endpoint:DELETE_/api/estimated-expenses/[id]:invalidates:[estimatedExpenses(hid)]

  useIncomeSources.ts:
    useIncomeSources:queryKey:incomeSources(hid):endpoint:GET_/api/income-sources:invalidates:none
    useCreateIncomeSource:endpoint:POST_/api/income-sources:invalidates:[incomeSources(hid),budgetBaselines(hid)]
    useUpdateIncomeSource:endpoint:PUT_/api/income-sources/[id]:invalidates:[incomeSources(hid),budgetBaselines(hid)]
    NOTE:update=SCD_Type2(API_sets_old.is_current=false+inserts_new_record)

  useMembers.ts:
    useMembers:queryKey:members(hid):endpoint:GET_/api/household/members:invalidates:none
    useInvitations:queryKey:invitations(hid):endpoint:GET_/api/household/members/invitations:invalidates:none
    useInviteMember:endpoint:POST_/api/household/invite:invalidates:[invitations(hid)]
    useDeleteMember:endpoint:DELETE_/api/household/members/[id]:invalidates:[members(hid)]
    useLeaveHousehold:endpoint:POST_/api/household/members/leave:invalidates:[members(hid),household(hid)]

  useAccountMutations.ts:
    useUpdateAccount:endpoint:PUT_/api/accounts/[id]:invalidates:[accounts(hid)]
    useSoftDeleteAccount:endpoint:DELETE_/api/accounts/[id]:invalidates:[accounts(hid)]

  useBudgetBaselines.ts:
    useBudgetBaselines:queryKey:budgetBaselines(hid):endpoint:GET_/api/budget/baselines:invalidates:none
    useBatchUpdateBaselines:endpoint:PUT_/api/budget/baselines:invalidates:[budgetBaselines(hid),budgetActuals(hid,month),budget(hid,month),dashboard(hid,month)]
    useCreateCustomBaseline:endpoint:POST_/api/budget/baselines:invalidates:[budgetBaselines(hid),budgetActuals(hid,month)]
    useDeleteCustomBaseline:endpoint:DELETE_/api/budget/baselines/[id]:invalidates:[budgetBaselines(hid),budgetActuals(hid,month)]

  useHouseholdSettings.ts:
    useUpdateHousehold:endpoint:PUT_/api/household:invalidates:[household(hid)]

### API Routes (src/app/api/)

APIS:
  --- CATEGORIES CRUD ---
  POST /api/categories:
    req:{name,group_id,default_behavior_type,icon?}
    resp:{data:Category,error:null}
    errors:400(validation)|401(no_auth)|403(system_group)|500
    guard:withAuth→auth.supabase.from("categories").insert({...body,household_id,is_system:false,created_by_member_id:memberId})
    rules:BR-CA-004(behavior_type_required)|BR-CA-005(must_use_existing_group)

  PUT /api/categories/[id]:
    req:{name?,icon?,is_active?}
    resp:{data:Category,error:null}
    errors:400|401|403(is_system=true_reject)|404|500
    guard:withAuth→check_is_system=false→update
    rules:BR-SY-001(system=immutable)|BR-CA-003(soft_delete_if_has_tx)

  DELETE /api/categories/[id]:
    req:none
    resp:{data:null,error:null}
    errors:401|403(is_system)|404|500
    guard:withAuth→check_is_system=false→check_has_transactions→hard_delete_or_reject
    rules:BR-CA-003(0_tx→hard_DELETE|has_tx→reject_use_PUT_is_active=false)

  --- DEBT CRUD ---
  POST /api/debt:
    req:{creditor_name,debt_type,total_amount,remaining_amount?,monthly_payment,interest_rate?,start_date?,expected_end_date?,member_id?,notes?}
    resp:{data:DebtEntry,error:null}
    errors:400|401|500
    guard:withAuth→auth.supabase.from("debt_entries").insert({...body,household_id})
    NOTE:trigger_recalculate_debt_budget_auto_fires_on_INSERT

  PUT /api/debt/[id]:
    req:{creditor_name?,debt_type?,total_amount?,remaining_amount?,monthly_payment?,interest_rate?,notes?}
    resp:{data:DebtEntry,error:null}
    errors:400|401|404|500
    guard:withAuth→auth.supabase.from("debt_entries").update().eq("id",id).eq("household_id",hid)
    NOTE:trigger_auto_fires_on_UPDATE

  PATCH /api/debt/[id]/paid-off:
    req:none(id_from_path)
    resp:{data:{debt:DebtEntry,is_last_debt:boolean},error:null}
    errors:401|404|409(already_paid_off)|500
    guard:withAuth→check_status=active→update(status=paid_off,actual_end_date=today,remaining_amount=0)
    trigger_auto_recalculates_budget
    post_check:count_remaining_active_debts→is_last_debt_flag_for_celebration_UI

  --- ESTIMATED EXPENSES CRUD ---
  GET /api/estimated-expenses:
    resp:{data:EstimatedExpense[],error:null}
    guard:withAuth→auth.supabase.from("estimated_expenses").select().eq("household_id",hid).order("created_at",desc)

  POST /api/estimated-expenses:
    req:{name,category_id?,linked_fund_id?,estimated_amount,target_date?,notes?}
    resp:{data:EstimatedExpense,error:null}
    errors:400|401|500
    guard:withAuth→insert

  PUT /api/estimated-expenses/[id]:
    req:{name?,estimated_amount?,actual_amount?,status?,target_date?,notes?}
    resp:{data:EstimatedExpense,error:null}
    errors:400|401|404|500

  DELETE /api/estimated-expenses/[id]:
    req:none
    resp:{data:null,error:null}
    errors:401|404|500

  --- INCOME SOURCES ---
  GET /api/income-sources:
    resp:{data:{current:IncomeSource[],history:IncomeSource[]},error:null}
    guard:withAuth→fetch_all_for_household→split_by_is_current

  POST /api/income-sources:
    req:{source_name,monthly_amount,member_id?}
    resp:{data:IncomeSource,error:null}
    errors:400|401|500
    guard:withAuth→insert(is_current=true,effective_from=today)

  PUT /api/income-sources/[id]:
    req:{monthly_amount}(SCD_Type2)
    resp:{data:IncomeSource,error:null}
    errors:400|401|404|500
    logic:set_old.is_current=false+effective_to=today→insert_new(same_source_name,new_amount,is_current=true,effective_from=today)
    IMPORTANT:both_ops_in_single_transaction→use_supabaseAdmin_for_atomicity_OR_wrap_in_Promise.all
    DECISION:use_supabaseAdmin_with_auth_check_first(same_pattern_as_household_route)

  --- ACCOUNTS SETTINGS ---
  PUT /api/accounts/[id]:
    req:{name?,bank_name?,account_type?,owner_name?,is_credit_card?,color?}
    resp:{data:Account,error:null}
    errors:400|401|404|500

  DELETE /api/accounts/[id]:
    req:none
    resp:{data:null,error:null}
    logic:soft_delete(is_active=false)_always_no_hard_delete
    errors:401|404|500

  --- MEMBERS ---
  GET /api/household/members:
    resp:{data:{members:Member[],invitations:Invitation[]},error:null}
    guard:withAuth→fetch_members+pending_invitations

  DELETE /api/household/members/[id]:
    req:none
    resp:{data:null,error:null}
    guard:withAuth→check_caller_is_owner→check_target_is_not_owner→soft_delete(is_active=false)
    errors:401|403(not_owner|cannot_delete_owner)|404|500

  POST /api/household/members/leave:
    req:none
    resp:{data:null,error:null}
    guard:withAuth→check_caller_is_not_owner→soft_delete_self(is_active=false)
    errors:401|403(owner_cannot_leave)|500

  --- HOUSEHOLD SETTINGS ---
  PUT /api/household:
    req:{name,currency?}
    resp:{data:Household,error:null}
    NOTE:add_PUT_to_existing_household/route.ts(currently_has_GET+POST)
    guard:withAuth→check_owner→supabaseAdmin.update

### Components (src/components/)

COMPONENTS:
  --- Settings Hub ---
  SettingsPage:type(Server):renders→SettingsMenu(Client)
  SettingsMenu:type(Client):renders→list_of_Link_items_with_icons+chevrons

  --- Categories ---
  CategoriesSettingsPage:type(Server):renders→CategoriesManager(Client)
  CategoriesManager:type(Client):renders→Accordion(cost_type→group→CategoryRow)+AddCategoryForm
  CategoryRow:type(Client):renders→name+behavior_chip+system_lock+edit/delete_buttons
  AddCategoryForm:type(Client):renders→inline_form(name+group_locked+behavior_select)
  EditCategoryDialog:type(Client):renders→Sheet_with_form

  --- Budget Baselines ---
  BudgetSettingsPage:type(Server):renders→BudgetBaselineManager(Client)
  BudgetBaselineManager:type(Client):renders→TotalBar+SystemBudgetTable+CustomBudgetTable+SaveButton
  SystemBudgetRow:type(Client):renders→name+pct_input+computed_amount+lock_icon
  CustomBudgetRow:type(Client):renders→name+linked_groups+pct_input+edit/delete
  AddCustomBaselineForm:type(Client):renders→Sheet(name+pct+linked_groups_multi_select)
  BudgetTotalBar:type(Client):renders→sticky_bar_showing_sum_pct+warning_if_>100

  --- Debt ---
  DebtSettingsPage:type(Server):renders→DebtManager(Client)
  DebtManager:type(Client):renders→DebtCardList+AddDebtFAB+BudgetImpactPreview
  DebtCard:type(Client):renders→creditor+status_badge+type+payment+remaining+buttons(edit|paid_off)
  DebtForm:type(Client):renders→Sheet(creditor_name+debt_type+total+remaining+monthly+rate+dates+member+notes)
  PaidOffConfirmDialog:type(Client):renders→AlertDialog(confirm_paid_off)
  CelebrationNotification:type(Client):renders→confetti_animation+toast_or_dialog

  --- Estimated Expenses ---
  EstimatedExpensesPage:type(Server):renders→EstimatedExpenseManager(Client)
  EstimatedExpenseManager:type(Client):renders→ExpenseList+AddFAB
  EstimatedExpenseCard:type(Client):renders→name+amount+status_badge+target_date+linked_fund_badge
  EstimatedExpenseForm:type(Client):renders→Sheet(name+category+fund+amount+date+notes)

  --- Accounts ---
  AccountsSettingsPage:type(Server):renders→AccountsManager(Client)
  AccountsManager:type(Client):renders→AccountList+AddAccountNote
  AccountSettingsCard:type(Client):renders→name+type+bank+credit_card_badge+edit/deactivate
  AccountEditForm:type(Client):renders→Sheet(name+bank+type+owner+credit_card_toggle+color)

  --- Income Sources ---
  IncomeSettingsPage:type(Server):renders→IncomeManager(Client)
  IncomeManager:type(Client):renders→CurrentIncomeList+HistoryAccordion+AddFAB
  IncomeSourceCard:type(Client):renders→source_name+amount+effective_from+member+edit_button
  IncomeSourceForm:type(Client):renders→Sheet(source_name+amount+member_select)
  IncomeHistoryItem:type(Client):renders→source_name+amount+effective_from+effective_to(muted)

  --- Members ---
  MembersSettingsPage:type(Server):renders→MembersManager(Client)
  MembersManager:type(Client):renders→MemberList+PendingInvitesList+InviteFAB(owner_only)
  MemberCard:type(Client):renders→display_name+role_badge+joined_at+delete_button(owner_only)
  InviteCard:type(Client):renders→email+role+status_badge+expires_at
  InviteMemberForm:type(Client):renders→Sheet(email+display_name+role_select)
  LeaveHouseholdButton:type(Client):renders→destructive_button+ConfirmDialog

  --- Household ---
  HouseholdSettingsPage:type(Server):renders→HouseholdSettingsForm(Client)
  HouseholdSettingsForm:type(Client):renders→form(name_input+type_display_readonly+currency_select)+SaveButton

  --- Shared (reuse existing) ---
  EmptyState:already_exists(check)|if_not_create
  SkeletonLoader:already_exists_pattern
  ConfirmDialog:reuse_AlertDialog_pattern

### Pages (src/app/(app)/settings/)

PAGES:
  /settings:auth_gate(withAuth_via_layout):data_source(none_static_menu)
  /settings/categories:auth_gate(layout):data_source(useCategories+useCategoryMutations)
  /settings/budget:auth_gate(layout):data_source(useBudgetBaselines+useBatchUpdateBaselines+useCreateCustomBaseline)
  /settings/debt:auth_gate(layout):data_source(useDebtEntries+useDebtMutations)
  /settings/estimated-expenses:auth_gate(layout):data_source(useEstimatedExpenses)
  /settings/accounts:auth_gate(layout):data_source(useAccounts+useAccountMutations)
  /settings/income:auth_gate(layout):data_source(useIncomeSources)
  /settings/members:auth_gate(layout):data_source(useMembers+useInvitations)
  /settings/household:auth_gate(layout):data_source(useHousehold+useUpdateHousehold)

FILE_STRUCTURE:
  src/app/(app)/settings/
    page.tsx                          (MOD:replace_placeholder)
    categories/page.tsx               (NEW)
    budget/page.tsx                    (NEW)
    debt/page.tsx                      (NEW)
    estimated-expenses/page.tsx        (NEW)
    accounts/page.tsx                  (NEW)
    income/page.tsx                    (NEW)
    members/page.tsx                   (NEW)
    household/page.tsx                 (NEW)

  src/app/api/
    categories/
      route.ts                         (NEW:GET+POST)
      [id]/route.ts                    (NEW:PUT+DELETE)
    debt/
      route.ts                         (MOD:add_POST)
      [id]/route.ts                    (NEW:PUT)
      [id]/paid-off/route.ts           (NEW:PATCH)
    estimated-expenses/
      route.ts                         (NEW:GET+POST)
      [id]/route.ts                    (NEW:PUT+DELETE)
    income-sources/
      route.ts                         (NEW:GET+POST)
      [id]/route.ts                    (NEW:PUT)
    accounts/
      route.ts                         (MOD:leave_GET_add_POST)
      [id]/route.ts                    (NEW:PUT+DELETE)
    household/
      route.ts                         (MOD:add_PUT)
      members/
        route.ts                       (NEW:GET)
        [id]/route.ts                  (NEW:DELETE)
        leave/route.ts                 (NEW:POST)

  src/lib/hooks/
    useCategoryMutations.ts            (NEW)
    useDebtMutations.ts                (NEW)
    useEstimatedExpenses.ts            (NEW)
    useIncomeSources.ts                (NEW)
    useMembers.ts                      (NEW)
    useAccountMutations.ts             (NEW)
    useBudgetBaselines.ts              (NEW)
    useHouseholdSettings.ts            (NEW)

  src/lib/validations/
    category.ts                        (NEW)
    debt.ts                            (NEW)
    estimated-expense.ts               (NEW)
    income-source.ts                   (NEW)
    member.ts                          (NEW)
    account-settings.ts                (NEW)
    household-settings.ts              (NEW)
    budget-baseline.ts                 (NEW)

  src/components/settings/             (NEW_DIR)
    SettingsMenu.tsx
    CategoriesManager.tsx
    CategoryRow.tsx
    AddCategoryForm.tsx
    EditCategoryDialog.tsx
    BudgetBaselineManager.tsx
    SystemBudgetRow.tsx
    CustomBudgetRow.tsx
    AddCustomBaselineForm.tsx
    BudgetTotalBar.tsx
    DebtManager.tsx
    DebtCard.tsx
    DebtForm.tsx
    PaidOffConfirmDialog.tsx
    CelebrationNotification.tsx
    EstimatedExpenseManager.tsx
    EstimatedExpenseCard.tsx
    EstimatedExpenseForm.tsx
    AccountsManager.tsx
    AccountSettingsCard.tsx
    AccountEditForm.tsx
    IncomeManager.tsx
    IncomeSourceCard.tsx
    IncomeSourceForm.tsx
    IncomeHistoryItem.tsx
    MembersManager.tsx
    MemberCard.tsx
    InviteCard.tsx
    InviteMemberForm.tsx
    LeaveHouseholdButton.tsx
    HouseholdSettingsForm.tsx

### Data Flow

DATA_FLOW:
  categories_CRUD:user→AddCategoryForm→useCreateCategory→POST_/api/categories→insert(categories)→invalidate(categories)→CategoriesManager_refetch
  category_delete:user→trash_icon→ConfirmDialog→useDeleteCategory→DELETE_/api/categories/[id]→check_tx_count→hard_delete_or_reject→invalidate
  budget_save:user→BudgetBaselineManager→useBatchUpdateBaselines→PUT_/api/budget/baselines→loop_update_budget_pct→invalidate(baselines+actuals+dashboard)
  debt_paid_off:user→PaidOffConfirmDialog→usePaidOffDebt→PATCH_/api/debt/[id]/paid-off→update(status+dates)→trigger_recalculate_debt_budget→resp(is_last_debt)→if_true:CelebrationNotification→invalidate(debts+baselines+actuals)
  income_update_SCD2:user→IncomeSourceForm→useUpdateIncomeSource→PUT_/api/income-sources/[id]→set_old.is_current=false→insert_new→invalidate(incomeSources+baselines)
  member_delete:owner→MemberCard→ConfirmDialog→useDeleteMember→DELETE_/api/household/members/[id]→check_owner→soft_delete→invalidate(members)
  member_leave:non_owner→LeaveHouseholdButton→ConfirmDialog→useLeaveHousehold→POST_/api/household/members/leave→check_not_owner→soft_delete_self→redirect_/login

## Decisions

D1:withAuth_pattern→all_S4_routes_use_withAuth()_returning_user-scoped_supabase_client(RLS_handles_household_scoping):consistent_with_debt/accounts/budget_existing_routes
D2:income_SCD2_update→use_supabaseAdmin_for_atomicity_of_2-step_op(set_old+insert_new):auth_check_via_createClient().auth.getUser()_first_then_supabaseAdmin_for_queries:same_pattern_as_household_route.ts
D3:category_delete_strategy→API_checks_tx_count:0_tx=hard_DELETE|>0_tx=return_error_with_message_to_use_soft_delete_via_PUT_is_active=false:simpler_than_auto_soft_delete_in_DELETE_endpoint
D4:budget_baselines_edit→batch_PUT_endpoint_accepts_array_of_{id,budget_pct}:validates_total<=100_server_side:single_Save_button_UX_not_per_row_save
D5:debt_paid_off→separate_PATCH_/api/debt/[id]/paid-off_endpoint_not_generic_PUT:clear_intent+trigger_auto_fires+response_includes_is_last_debt_boolean
D6:member_management→owner-only_delete_via_role_check_in_API(not_RLS):RLS_allows_all_household_members_to_delete(too_permissive)→API_layer_enforces_owner_check
D7:estimated_expenses_no_RPC→simple_CRUD_no_atomicity_needed:direct_supabase_client_queries_via_withAuth
D8:accounts_no_hard_delete→always_soft_delete(is_active=false):accounts_referenced_by_transactions_FK
D9:no_new_migration_for_tables→all_17_tables_already_deployed_in_002_tables.sql:only_1_new_RPC(get_budget_baselines)_in_009
D10:UX_spec_missing_for_income/accounts/members/household/estimated-expenses→design_inferred_from_existing_patterns(card_list+sheet_form+FAB):documented_in_COMPONENTS_section

## Risks

RISK1:income_SCD2_not_truly_atomic→supabaseAdmin_2-step_op_can_fail_between_steps→mitigation:wrap_in_try/catch_revert_on_failure_OR_create_RPC_later_if_issues_arise
RISK2:budget_total>100_race_condition→2_users_edit_simultaneously_both_pass_client_validation→mitigation:server_validates_SUM_before_save_using_fresh_DB_read
RISK3:member_delete_cascading_data→soft_delete_only(is_active=false)_no_data_loss→BUT_member_id_FK_refs_in_transactions/income/debt_remain_valid
RISK4:9_settings_pages+8_hook_files+8_validation_files+12_API_route_files+30_components→large_sprint→mitigation:pages_follow_identical_pattern(Server→Client_manager→cards+form)_so_developer_can_template_quickly
RISK5:celebration_notification_on_last_debt→simple_toast_with_confetti_emoji_not_full_animation→keep_scope_small_can_enhance_later
RISK6:categories_CRUD_uses_user-scoped_supabase→existing_useCategories_hook_uses_createClient()_directly(not_API)→need_to_keep_both_patterns_OR_migrate_reads_to_API→DECISION:keep_existing_read_hook_as-is+new_mutations_go_through_API
