SPRINT:S2 AGENT:migration STATUS:DONE
FILES:supabase/migrations/007_s2_transaction_update_trigger.sql
RPCS:none_new (fund_contribute+fund_withdraw+get_budget_with_actuals already in 003)
RLS:none_new (004_rls.sql covers all S2 tables)
TRIGGERS:tx_set_behavior_type_on_update:BEFORE_UPDATE(category_id IS DISTINCT FROM)→reuses set_transaction_behavior_type()
VERIFY:happy_path=PENDING_SUPABASE_START|idempotency=PASS(DROP IF EXISTS+CREATE)|auth_guard=N/A(trigger,not RPC)
DEVIATIONS:none
KNOWN:none
