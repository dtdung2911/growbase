SPRINT:S3 STATUS:DONE
STORIES:US-5.01|US-5.02|US-5.03|US-5.04|US-5.05|US-5.06|US-6.01|US-6.02|US-7.01|US-7.02|US-7.03 ALL_ACS:PASS
FILES_NEW:47 FILES_MOD:8
TESTS:217/217 pass
TSC:0 errors
PIPELINE:planner→architect→migration→developer→reviewer(4C 7W 5M)→validator(fixed C1-C4 W1-W7 M5)→qa(PASS)
FEATURES_DELIVERED:
  dashboard:parallel_queries→DashboardData(totalIncome|totalExpense|savingsRate|spendingByBehavior|budgetLines|funds|recentTx)
  budget:get_budget_with_actuals_RPC→BudgetActualLine[]→expandable_groups+progress_bars+inline_override_edit
  budget_override:upsert+delete_with_household_id→invalidates[budgetActuals,budget,dashboard]
  net_worth:parallel[snapshot+get_system_balances+funds]→account_list+actual_inputs+discrepancy_calc+upsert
  net_worth_history:line_chart(Recharts)→monthly_trend(recorded_vs_system)
  scheduled_payments:CRUD+status_sections+DueBadge(overdue|due-soon|upcoming|normal)
  mark_paid:atomic_RPC(mark_payment_paid)→advance_next_due_date+optional_tx→invalidates[scheduledPayments,transactions,dashboard]
  reports:4_tabs(spending|income|budget_vs_actual|funds)
  responsive_shell:AppShell(DesktopDrawer_>=1024+BottomNav_<1024)+CSS_breakpoints
  theme:ThemeProvider(next-themes)+light_default
  i18n:custom_TranslationProvider+vi.json+en.json(91_keys)
RPCS_ADDED:get_system_balances|mark_payment_paid
INFRA:next-themes|custom_i18n(not next-intl)|ThemeProvider|TranslationProvider
KNOWN_ISSUES:
  K1:database.ts manual types→supabase gen types(S2 carry)
  K2:type cast GET /api/transactions(S2 carry)
  K3:internal_transfer not atomic(S2 carry)
  K4:system category lookup by name(S2 carry)
  K5:NavBadge due_soon_count not wired→S4
  K6:migration 008 not tested live(Docker down)→run supabase db reset before S4
NEXT_SPRINT:ready
