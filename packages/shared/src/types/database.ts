// Placeholder cho tới khi generate từ Supabase CLI: `supabase gen types typescript`.
// S1 manually khai báo các bảng/RPC mà app layer chạm tới (auth + onboarding).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type HouseholdRow = {
  id: string
  name: string
  household_type: "personal" | "family"
  currency: "VND" | "USD"
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

type HouseholdMemberRow = {
  id: string
  household_id: string
  user_id: string
  display_name: string
  role: "owner" | "member" | "viewer"
  joined_at: string
  is_active: boolean
}

type CategoryGroupRow = {
  id: string
  household_id: string | null
  cost_type_id: string
  name: string
  icon: string | null
  color: string | null
  is_system: boolean
  sort_order: number
  created_at: string
}

type CategoryRow = {
  id: string
  household_id: string | null
  group_id: string
  name: string
  icon: string | null
  default_behavior_type:
    | "fixed"
    | "variable"
    | "wasteful"
    | "debt_repayment"
    | "savings_investment"
    | "income"
    | "loan"
  is_system: boolean
  is_active: boolean
  sort_order: number
  created_by_member_id: string | null
  created_at: string
}

type CostTypeRow = {
  id: string
  household_id: string | null
  code: string
  display_name: string
  display_name_vi: string
  sort_order: number
  is_system: boolean
  created_at: string
}

type HouseholdInvitationRow = {
  id: string
  household_id: string
  email: string
  display_name: string
  role: "owner" | "member" | "viewer"
  token: string
  status: "pending" | "accepted" | "rejected" | "expired"
  expires_at: string
  created_at: string
}

// S2: Transaction + Fund + Account + Debt rows
type TransactionRow = {
  id: string
  household_id: string
  member_id: string | null
  amount: number
  direction: "in" | "out"
  transaction_type: "income" | "expense" | "internal_transfer" | "fund_contribution" | "fund_withdrawal" | "debt_repayment"
  category_id: string | null
  account_id: string
  fund_id: string | null
  debt_entry_id: string | null
  behavior_type: "fixed" | "variable" | "wasteful" | "debt_repayment" | "savings_investment" | "income" | "loan" | null
  is_unusual_income: boolean
  exclude_from_budget_report: boolean
  description: string | null
  transaction_date: string // timestamptz ISO kể từ migration 027
  import_source: string | null
  created_at: string
  updated_at: string
}

type AccountRow = {
  id: string
  household_id: string
  member_id: string | null
  name: string
  bank_name: string | null
  account_type: "bank" | "cash" | "savings" | "credit_card" | "investment" | "precious_metal"
  owner_name: string | null
  is_credit_card: boolean
  discount_rate: number | null
  is_active: boolean
  color: string | null
  sort_order: number
  created_at: string
}

type FundRow = {
  id: string
  household_id: string
  name: string
  description: string | null
  fund_type: "emergency" | "sinking" | "goal" | "investment" | "freedom"
  current_balance: number
  target_amount: number | null
  monthly_contribution: number | null
  contribution_day: number
  expected_return_rate: number | null
  target_date: string | null
  target_months_expense: number | null
  reset_monthly: boolean
  release_trigger: string | null
  released_at: string | null
  color: string | null
  icon: string | null
  is_active: boolean
  priority: number
  priority_rank: number | null
  per_member: boolean
  amount_per_member: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

type FundTransactionRow = {
  id: string
  household_id: string
  fund_id: string
  transaction_type: "contribution" | "withdrawal" | "interest" | "reset"
  amount: number
  direction: "in" | "out"
  balance_after: number
  linked_transaction_id: string | null
  description: string | null
  transaction_date: string // timestamptz ISO kể từ migration 027
  is_automatic: boolean
  created_at: string
}

type DebtEntryRow = {
  id: string
  household_id: string
  member_id: string | null
  creditor_name: string
  debt_type: "bank_loan" | "credit_card" | "mortgage" | "personal"
  total_amount: number
  remaining_amount: number
  monthly_payment: number
  interest_rate: number | null
  start_date: string
  expected_end_date: string | null
  actual_end_date: string | null
  status: "active" | "paid_off" | "refinanced"
  notes: string | null
  created_at: string
  updated_at: string
}

// S3: Budget Override, Net Worth, Scheduled Payment, Estimated Expense rows
type BudgetBaselineRow = {
  id: string
  household_id: string
  name: string
  description: string | null
  budget_pct: number
  is_system: boolean
  is_auto_calculated: boolean
  auto_calculated_source: string | null
  linked_category_group_ids: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

type BudgetOverrideRow = {
  id: string
  household_id: string
  budget_baseline_id: string
  month: string
  override_pct: number
  created_at: string
}

type NetWorthSnapshotRow = {
  id: string
  household_id: string
  snapshot_month: string
  total_recorded: number
  total_system: number
  discrepancy: number
  items: Json
  notes: string | null
  created_at: string
  updated_at: string
}

type ScheduledPaymentRow = {
  id: string
  household_id: string
  name: string
  amount: number
  period: "monthly" | "quarterly" | "yearly"
  payment_method: string | null
  next_due_date: string
  expiry_date: string | null
  status: "active" | "cancelled" | "expired"
  notes: string | null
  created_at: string
  updated_at: string
}

type EstimatedExpenseRow = {
  id: string
  household_id: string
  name: string
  category_id: string | null
  linked_fund_id: string | null
  estimated_amount: number
  actual_amount: number | null
  target_date: string | null
  status: "planned" | "completed" | "cancelled"
  notes: string | null
  created_at: string
}

type IncomeSourceRow = {
  id: string
  household_id: string
  member_id: string | null
  source_name: string
  monthly_amount: number
  effective_from: string
  effective_to: string | null
  is_current: boolean
  created_at: string
}

type InvestmentHoldingRow = {
  id: string
  household_id: string
  stock_code: string
  weight_pct: number
  total_invested: number
  current_value: number
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

type InvestmentDcaPlanRow = {
  id: string
  household_id: string
  stock_code: string
  target_allocation_pct: number
  is_active: boolean
  created_at: string
}

type InvestmentPurchaseRow = {
  id: string
  household_id: string
  holding_id: string
  purchase_month: string
  budget: number
  price: number
  fees: number
  quantity: number
  amount: number
  end_value: number
  monthly_return: number
  notes: string | null
  created_at: string
}

type EventBudgetRow = {
  id: string
  household_id: string
  name: string
  total_budget: number
  total_actual: number
  event_date: string | null
  status: "active" | "completed"
  notes: string | null
  created_at: string
}

type EventBudgetItemRow = {
  id: string
  event_budget_id: string
  name: string
  planned_amount: number
  actual_amount: number
  sort_order: number
  notes: string | null
  created_at: string
}

type MemberActivityRow = {
  household_id: string
  user_id: string
  active_date: string
}

type TableDef<Row, Insert> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      households: TableDef<
        HouseholdRow,
        Partial<HouseholdRow> & { name: string }
      >
      household_members: TableDef<
        HouseholdMemberRow,
        Partial<HouseholdMemberRow> & {
          household_id: string
          user_id: string
          display_name: string
        }
      >
      household_invitations: TableDef<
        HouseholdInvitationRow,
        Partial<HouseholdInvitationRow> & {
          household_id: string
          email: string
          display_name: string
        }
      >
      category_groups: TableDef<CategoryGroupRow, Partial<CategoryGroupRow>>
      categories: TableDef<CategoryRow, Partial<CategoryRow>>
      cost_types: TableDef<CostTypeRow, Partial<CostTypeRow>>
      transactions: TableDef<
        TransactionRow,
        Omit<TransactionRow, "id" | "behavior_type" | "exclude_from_budget_report" | "import_source" | "fund_id" | "debt_entry_id" | "created_at" | "updated_at"> & {
          id?: string
          behavior_type?: TransactionRow["behavior_type"]
          exclude_from_budget_report?: boolean
          import_source?: string | null
          fund_id?: string | null
          debt_entry_id?: string | null
        }
      >
      accounts: TableDef<AccountRow, Partial<AccountRow> & { household_id: string; name: string }>
      funds: TableDef<FundRow, Partial<FundRow> & { household_id: string; name: string; fund_type: FundRow["fund_type"] }>
      fund_transactions: TableDef<FundTransactionRow, Partial<FundTransactionRow>>
      debt_entries: TableDef<DebtEntryRow, Partial<DebtEntryRow> & { household_id: string; creditor_name: string }>
      budget_baselines: TableDef<BudgetBaselineRow, Partial<BudgetBaselineRow> & { household_id: string; name: string; budget_pct: number }>
      budget_overrides: TableDef<BudgetOverrideRow, Partial<BudgetOverrideRow> & { budget_baseline_id: string; month: string; override_pct: number }>
      net_worth_snapshots: TableDef<NetWorthSnapshotRow, Partial<NetWorthSnapshotRow> & { household_id: string; snapshot_month: string; total_recorded: number; total_system: number; items: Json }>
      member_activity: TableDef<MemberActivityRow, { household_id: string; user_id: string; active_date?: string }>
      scheduled_payments: TableDef<ScheduledPaymentRow, Partial<ScheduledPaymentRow> & { household_id: string; name: string; amount: number; period: ScheduledPaymentRow["period"]; next_due_date: string }>
      estimated_expenses: TableDef<EstimatedExpenseRow, Partial<EstimatedExpenseRow> & { household_id: string; name: string; estimated_amount: number }>
      income_sources: TableDef<IncomeSourceRow, Partial<IncomeSourceRow> & { household_id: string; source_name: string; monthly_amount: number }>
      investment_holdings: TableDef<InvestmentHoldingRow, Partial<InvestmentHoldingRow> & { household_id: string; stock_code: string }>
      investment_dca_plans: TableDef<InvestmentDcaPlanRow, Partial<InvestmentDcaPlanRow> & { household_id: string; stock_code: string }>
      investment_purchases: TableDef<InvestmentPurchaseRow, Partial<InvestmentPurchaseRow> & { household_id: string; holding_id: string; purchase_month: string; price: number }>
      event_budgets: TableDef<EventBudgetRow, Partial<EventBudgetRow> & { household_id: string; name: string }>
      event_budget_items: TableDef<EventBudgetItemRow, Partial<EventBudgetItemRow> & { event_budget_id: string; name: string }>
    }
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>
    Functions: {
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          invitation_id: string
          household_id: string
          household_name: string
          email: string
          display_name: string
          role: "owner" | "member" | "viewer"
          status: "pending" | "accepted" | "rejected" | "expired"
          expires_at: string
        }[]
      }
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: string
      }
      complete_onboarding: {
        Args: {
          p_household_id: string
          p_income_sources: Json
          p_accounts: Json
          p_debt_entries: Json
          p_budget_pcts: Json
        }
        Returns: string
      }
      fund_expense: {
        Args: {
          p_household_id: string
          p_fund_id: string
          p_member_id: string
          p_amount: number
          p_category_id: string
          p_account_id: string
          p_description?: string
          p_date?: string
        }
        Returns: string
      }
      transaction_change_fund_source: {
        Args: {
          p_household_id: string
          p_transaction_id: string
          p_fund_id?: string | null
        }
        Returns: undefined
      }
      fund_contribution_revert: {
        Args: {
          p_household_id: string
          p_fund_tx_id: string
        }
        Returns: undefined
      }
      fund_contribute: {
        Args: {
          p_household_id: string
          p_fund_id: string
          p_member_id: string
          p_amount: number
          p_account_id: string
          p_category_id: string
          p_description: string
          p_date: string
        }
        Returns: string
      }
      fund_withdraw: {
        Args: {
          p_household_id: string
          p_fund_id: string
          p_member_id: string
          p_amount: number
          p_account_id: string
          p_category_id: string
          p_description: string
          p_date: string
        }
        Returns: string
      }
      get_budget_with_actuals: {
        Args: {
          p_household_id: string
          p_month: string
        }
        Returns: Json
      }
      get_system_balances: {
        Args: {
          p_household_id: string
        }
        Returns: {
          account_id: string
          account_name: string
          account_type: string
          system_balance: number
        }[]
      }
      mark_payment_paid: {
        Args: {
          p_payment_id: string
          p_household_id: string
          p_create_transaction: boolean
          p_account_id: string
          p_category_id: string
          p_member_id: string
          p_date: string
        }
        Returns: string
      }
      get_budget_baselines: {
        Args: { p_household_id: string }
        Returns: {
          id: string
          name: string
          description: string | null
          budget_pct: number
          is_system: boolean
          is_auto_calculated: boolean
          auto_calculated_source: string | null
          linked_category_group_ids: string[]
          sort_order: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
