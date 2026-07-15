SPRINT:S4 AGENT:migration STATUS:DONE
FILES:[supabase/migrations/009_s4_budget_baselines_list.sql]
RPCS:[get_budget_baselines(p_household_id uuid)->TABLE(id,name,description,budget_pct,is_system,is_auto_calculated,auto_calculated_source,linked_category_group_ids,sort_order)]
RLS:[none_new|all_covered_in_004_rls.sql]
VERIFY:happy_path=PASS|idempotency=PASS|auth_guard=PASS
DEVIATIONS:none
KNOWN:none
