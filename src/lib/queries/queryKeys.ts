export const keys = {
  household: (id: string) => ["household", id] as const,
  transactions: (hid: string, month: string) =>
    ["transactions", hid, month] as const,
  funds: (hid: string) => ["funds", hid] as const,
  fundDetail: (hid: string, fundId: string) =>
    ["fundDetail", hid, fundId] as const,
  budget: (hid: string, month: string) => ["budget", hid, month] as const,
  reports: (hid: string, month: string, tab: string) =>
    ["reports", hid, month, tab] as const,
  debts: (hid: string) => ["debts", hid] as const,
  categories: (hid: string) => ["categories", hid] as const,
  costTypes: (hid: string) => ["costTypes", hid] as const,
  accounts: (hid: string) => ["accounts", hid] as const,
  fundTransactions: (hid: string, fundId: string) =>
    ["fundTransactions", hid, fundId] as const,
  incomeSource: (hid: string) => ["incomeSource", hid] as const,
  incomeSources: (hid: string) => ["incomeSources", hid] as const,
  estimatedExpenses: (hid: string) => ["estimatedExpenses", hid] as const,
  members: (hid: string) => ["members", hid] as const,
  invitations: (hid: string) => ["invitations", hid] as const,
  budgetBaselines: (hid: string) => ["budgetBaselines", hid] as const,
  scheduledPayments: (hid: string) => ["scheduledPayments", hid] as const,
  netWorth: (hid: string, month: string) => ["netWorth", hid, month] as const,
  netWorthHistory: (hid: string) => ["netWorthHistory", hid] as const,
  budgetActuals: (hid: string, month: string) =>
    ["budgetActuals", hid, month] as const,
  budgetOverrides: (hid: string, month: string) =>
    ["budgetOverrides", hid, month] as const,
  dashboard: (hid: string, month: string) =>
    ["dashboard", hid, month] as const,
  systemBalances: (hid: string) => ["systemBalances", hid] as const,
  investmentHoldings: (hid: string) => ["investmentHoldings", hid] as const,
  investmentDcaPlans: (hid: string) => ["investmentDcaPlans", hid] as const,
  investmentPurchases: (hid: string, holdingId?: string) =>
    ["investmentPurchases", hid, holdingId ?? "all"] as const,
  eventBudgets: (hid: string) => ["eventBudgets", hid] as const,
  eventBudget: (hid: string, eventBudgetId: string) =>
    ["eventBudget", hid, eventBudgetId] as const,
  monthlySummary: (hid: string, months: number) =>
    ["monthlySummary", hid, months] as const,
  livingPlan: (hid: string) => ["livingPlan", hid] as const,
}
