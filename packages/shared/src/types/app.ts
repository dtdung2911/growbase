import type { User } from "@supabase/supabase-js"

export type { User }

export type HouseholdType = "personal" | "family"
export type Currency = "VND" | "USD"
export type MemberRole = "owner" | "member" | "viewer"
export type AccountType =
  | "bank"
  | "cash"
  | "savings"
  | "credit_card"
  | "investment"
  | "precious_metal"
export type DebtType = "bank_loan" | "credit_card" | "mortgage" | "personal"

export type Household = {
  id: string
  name: string
  household_type: HouseholdType
  currency: Currency
  onboarding_completed: boolean
}

// S2: Transaction domain types
export type TransactionDirection = "in" | "out"
export type TransactionType =
  | "income"
  | "expense"
  | "internal_transfer"
  | "fund_contribution"
  | "fund_withdrawal"
  | "debt_repayment"
export type BehaviorType =
  | "fixed"
  | "variable"
  | "wasteful"
  | "debt_repayment"
  | "savings_investment"
  | "loan"

export type FundType =
  | "emergency"
  | "sinking"
  | "goal"
  | "investment"
  | "freedom"

export const FUND_TYPE_CONFIG = {
  emergency:  { icon: "lucide:shield", color: "#E24B4A", bgColor: "#FCEBEB", label: "Khẩn cấp", labelEn: "Emergency" },
  sinking:    { icon: "lucide:piggy-bank", color: "#EF9F27", bgColor: "#FAEEDA", label: "Tích lũy", labelEn: "Sinking" },
  goal:       { icon: "lucide:target", color: "#639922", bgColor: "#EAF3DE", label: "Mục tiêu", labelEn: "Goal" },
  investment: { icon: "lucide:trending-up", color: "#7F77DD", bgColor: "#EEEDFE", label: "Đầu tư", labelEn: "Investment" },
  freedom:    { icon: "lucide:sparkles", color: "#0084DB", bgColor: "#E6F1FB", label: "Tự do", labelEn: "Freedom" },
} as const

export type DebtStatus = "active" | "paid_off" | "refinanced"

export type TransactionWithJoins = {
  id: string
  household_id: string
  member_id: string
  amount: number
  direction: TransactionDirection
  transaction_type: TransactionType
  category_id: string
  account_id: string
  fund_id: string | null
  debt_entry_id: string | null
  behavior_type: BehaviorType | null
  is_unusual_income: boolean
  exclude_from_budget_report: boolean
  description: string | null
  transaction_date: string
  created_at: string
  updated_at: string
  category: { id: string; name: string; icon: string | null } | null
  account: { id: string; name: string; color: string | null } | null
}

export type Account = {
  id: string
  household_id: string
  name: string
  bank_name: string | null
  account_type: AccountType
  owner_name: string | null
  is_credit_card: boolean
  color: string | null
  sort_order: number
  is_active: boolean
}

export type Fund = {
  id: string
  household_id: string
  name: string
  description: string | null
  fund_type: FundType
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
}

export type FundTransaction = {
  id: string
  fund_id: string
  transaction_type: "contribution" | "withdrawal" | "release" | "reset"
  amount: number
  direction: "in" | "out"
  balance_after: number
  description: string | null
  transaction_date: string
  is_automatic: boolean
  created_at: string
}

export type DebtEntry = {
  id: string
  household_id: string
  member_id: string | null
  creditor_name: string
  debt_type: DebtType
  total_amount: number
  remaining_amount: number
  monthly_payment: number
  interest_rate: number | null
  start_date: string
  expected_end_date: string | null
  actual_end_date: string | null
  status: DebtStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// S4: Settings domain types
export type EstimatedExpenseStatus = "planned" | "completed" | "cancelled"

export type IncomeSource = {
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

export type Member = {
  id: string
  household_id: string
  user_id: string
  display_name: string
  role: MemberRole
  joined_at: string
  is_active: boolean
}

export type Invitation = {
  id: string
  household_id: string
  email: string
  display_name: string
  role: MemberRole
  token?: string
  status: "pending" | "accepted" | "rejected" | "expired"
  expires_at: string
  created_at: string
}

export type EstimatedExpense = {
  id: string
  household_id: string
  name: string
  category_id: string | null
  linked_fund_id: string | null
  estimated_amount: number
  actual_amount: number | null
  target_date: string | null
  status: EstimatedExpenseStatus
  notes: string | null
  created_at: string
}

export type BudgetBaseline = {
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
}

// S3: Budget, Net Worth, Scheduled Payments, Dashboard
export type PaymentPeriod = "monthly" | "quarterly" | "yearly"
export type PaymentStatus = "active" | "cancelled" | "expired"
export type UrgencyLevel = "overdue" | "due-soon" | "upcoming" | "normal"

export type ScheduledPayment = {
  id: string
  household_id: string
  name: string
  amount: number
  period: PaymentPeriod
  payment_method: string | null
  next_due_date: string
  expiry_date: string | null
  status: PaymentStatus
  notes: string | null
  created_at: string
  updated_at: string
  days_until_due: number
  urgency_level: UrgencyLevel
}

export type NetWorthSnapshot = {
  id: string
  household_id: string
  snapshot_month: string
  total_recorded: number
  total_system: number
  discrepancy: number
  items: NetWorthItem[]
  notes: string | null
  created_at: string
}

export type NetWorthItem = {
  account_id: string
  account_name: string
  account_type: AccountType
  balance_recorded: number
  balance_system: number
}

export type BudgetActualLine = {
  cost_type_id: string
  cost_type_code: string
  cost_type_name: string
  budget_pct: number
  override_pct: number | null
  effective_pct: number
  budget_amount: number
  actual_amount: number
  remaining: number
  usage_pct: number
}

export type BudgetOverride = {
  id: string
  budget_baseline_id: string
  month: string
  override_pct: number
  created_at: string
}

export type SystemBalance = {
  account_id: string
  account_name: string
  account_type: string
  system_balance: number
}

export type SpendingByBehavior = {
  behavior_type: BehaviorType
  total: number
  percentage: number
}

export type TopExpenseCategory = {
  name: string
  icon: string | null
  amount: number
  pct: number
}

export type WeekdaySpending = {
  day: number // 0=Sun..6=Sat
  amount: number
}

export type DashboardData = {
  totalIncome: number
  totalExpense: number
  fundContributions: number
  savingsRate: number
  lastMonthIncome: number
  lastMonthExpense: number
  netWorth: number | null
  spendingByBehavior: SpendingByBehavior[]
  budgetLines: BudgetActualLine[]
  funds: Fund[]
  recentTransactions: TransactionWithJoins[]
  topExpenseCategories: TopExpenseCategory[]
  weekdaySpending: WeekdaySpending[]
  hasAnyTransactionEver: boolean
  yesterdayTransactions: Pick<TransactionWithJoins, "amount" | "direction" | "behavior_type">[]
  activeDaysLast7: number
}

export type InvestmentHolding = {
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

export type InvestmentDcaPlan = {
  id: string
  household_id: string
  stock_code: string
  target_allocation_pct: number
  is_active: boolean
  created_at: string
}

export type InvestmentPurchase = {
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
  holding?: { stock_code: string }
}

export type EventBudgetStatus = "active" | "completed"

export type EventBudget = {
  id: string
  household_id: string
  name: string
  total_budget: number
  total_actual: number
  event_date: string | null
  status: EventBudgetStatus
  notes: string | null
  created_at: string
}

export type EventBudgetItem = {
  id: string
  event_budget_id: string
  name: string
  planned_amount: number
  actual_amount: number
  sort_order: number
  notes: string | null
  created_at: string
}

export type EventBudgetWithItems = EventBudget & {
  items: EventBudgetItem[]
}

export type HouseholdSummary = {
  id: string
  name: string
  role: "owner" | "member"
}
