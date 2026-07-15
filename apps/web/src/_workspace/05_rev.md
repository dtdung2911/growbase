SPRINT:S4 AGENT:reviewer STATUS:NEEDS_FIX
CRITICAL:4 WARNING:7 MINOR:5
ISSUES:
  C1:src/app/api/household/members/route.ts:17:invitation_token_leaked→API_selects_token_field_and_returns_to_client→InviteCard_renders_it→attacker_can_accept_invite→fix:remove_token_from_select_clause
  C2:src/app/api/budget/baselines/route.ts:38-44:PUT_batch_update_has_NO_guard_against_is_auto_calculated_baselines→user_can_overwrite_debt_budget_pct_that_DB_trigger_auto-calculates(BR-BU-002_violation)→fix:filter_out_baselines_WHERE_is_auto_calculated=true_before_update_OR_add_WHERE_is_auto_calculated=false
  C3:src/app/api/debt/route.ts:15-16:GET_filters_.eq("status","active")→DebtManager_client_splits_activeDebts/paidOffDebts_but_paidOffDebts_always_empty→paid-off_section_never_shows→fix:remove_.eq("status","active")_from_GET_or_add_separate_endpoint
  C4:src/components/settings/CelebrationNotification.tsx:11-16:show_prop_never_resets_to_false→if_PaidOffConfirmDialog_unmounts+remounts_the_state_persists_true→toast_fires_again_on_rerender→fix:add_onDismiss_callback_OR_use_ref_to_track_shown_state
  W1:src/app/api/estimated-expenses/route.ts:11:select("*")→returns_ALL_columns_including_potential_future_sensitive_fields→fix:explicit_column_list
  W2:src/app/api/income-sources/route.ts:11:select("*")→same_as_W1→fix:explicit_column_list
  W3:src/app/api/income-sources/[id]/route.ts:23-68:SCD_Type2_update_uses_supabaseAdmin_2-step(close_old+insert_new)_not_atomic→if_insert_fails_old_record_closed_with_no_replacement→fix:wrap_in_DB_transaction_or_single_RPC(KNOWN_issue_per_04_dev.md)
  W4:src/components/settings/CategoryRow.tsx:59-60:edit/delete_icon_buttons_h-8_w-8→below_44px_min_touch_target(R7)→fix:min-h-[44px]_min-w-[44px]_or_h-11_w-11
  W5:src/components/settings/DebtCard.tsx:64-78:edit/paidOff_icon_buttons_h-8_w-8→same_R7_violation→fix:same_as_W4
  W6:src/components/settings/EstimatedExpenseCard.tsx:55-69:edit/delete_icon_buttons_h-8_w-8→same_R7_violation
  W7:src/components/settings/AccountSettingsCard.tsx:62-76:edit/deactivate_icon_buttons_h-8_w-8→same_R7_violation
  M1:src/components/settings/CategoriesManager.tsx:5:unused_import_cn→remove
  M2:src/components/settings/BudgetBaselineManager.tsx:6:unused_import_Separator→remove
  M3:src/components/settings/AccountEditForm.tsx:166:hardcoded_color_#D97757→use_CSS_var_or_brand_token
  M4:src/app/(app)/settings/estimated-expenses/page.tsx:5:inconsistent_h1_text-xl_vs_other_pages_text-lg
  M5:src/app/(app)/settings/accounts/page.tsx:5|income/page.tsx:5|members/page.tsx:5|household/page.tsx:5:same_text-xl_inconsistency→should_be_text-lg_like_settings/page.tsx+categories+budget+debt
APPROVED_IF_ZERO_C:false
GOOD:auth_check_first_all_routes|keys_factory_100%_coverage|skeleton_loading_not_spinner|ConfirmDialog_on_all_destructive|toast_durations_correct(2s_success_5s_error)|is_system_guard_on_categories|Zod_validation_on_all_inputs|pb-16_on_all_pages|query_invalidation_thorough|budget_batch_refine_sum<=100
