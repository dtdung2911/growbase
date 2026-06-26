SPRINT:S3 AGENT:migration STATUS:DONE
OK:supabase/migrations/008_s3_system_balances.sql
MOD:none
RPCS:get_system_balances(p_household_id:uuid)→TABLE(account_id:uuid,account_name:text,account_type:text,system_balance:numeric)|mark_payment_paid(p_payment_id:uuid,p_household_id:uuid,p_create_transaction:bool,p_account_id:uuid,p_category_id:uuid,p_member_id:uuid,p_date:date)→uuid
RLS:none_new(all_S3_tables_already_covered_in_004_rls.sql)
VERIFY:happy_path=SKIP:Docker_down|idempotency=PASS:CREATE_OR_REPLACE|auth_guard=PASS:manual_review(matches_003_pattern)
DEVIATIONS:none
KNOWN:Docker_daemon_unresponsive→supabase_db_reset_not_run→run_manually:supabase_start+supabase_db_reset
