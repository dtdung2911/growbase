import type {
  BudgetActualLine,
  DashboardData,
  Fund,
  SpendingByBehavior,
  TopExpenseCategory,
  TransactionWithJoins,
  WeekdaySpending,
} from "@growbase/shared/types/app"
import {
  BUDGET_TEMPLATE,
  COST_TYPE_GROUP_LABELS,
  estimateEmergencyTarget,
  type CostTypeGroupKey,
} from "@growbase/shared/constants/budgetTemplate"
import type { Locale } from "@/lib/i18n/TranslationProvider"

type TFunction = (key: string, vars?: Record<string, string | number>) => string

// Số liệu tĩnh cho màn Hook (story 4.6) — không tied vào ngày thực của thiết bị,
// đây là 1 "lát cắt" cố định của nhà Minnie, không phải today's date thật.
export const HOOK_DEMO_MONTHLY_INCOME = 12_750_000
export const HOOK_DEMO_MONTH = "2026-06"
export const HOOK_DEMO_TODAY_REFERENCE = new Date(2026, 5, 15)

const LAST_MONTH = "2026-05"

type SeedTx = {
  id: string
  month: string
  day: number
  categoryName: string
  categoryIcon: string
  categoryGroup: CostTypeGroupKey | null
  descriptionKey: string
  amount: number
  direction: "in" | "out"
  transactionType: "income" | "expense"
}

// Mỗi categoryName khớp linkedCategoryGroupNames trong BUDGET_TEMPLATE (budgetTemplate.ts)
// — cost-type-group và behavior_type derive từ đây, không tự đặt riêng.
const SEED_TRANSACTIONS: SeedTx[] = [
  // Tháng 6/2026 (tháng hiện tại của demo)
  { id: "demo-tx-06-01", month: HOOK_DEMO_MONTH, day: 1, categoryName: "Thu nhập", categoryIcon: "💵", categoryGroup: null, descriptionKey: "setupV2.hook.demo.tx.salary", amount: HOOK_DEMO_MONTHLY_INCOME, direction: "in", transactionType: "income" },
  { id: "demo-tx-06-02", month: HOOK_DEMO_MONTH, day: 6, categoryName: "Thực phẩm & Ăn uống hàng ngày", categoryIcon: "🛒", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.groceries", amount: 925_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-03", month: HOOK_DEMO_MONTH, day: 20, categoryName: "Thực phẩm & Ăn uống hàng ngày", categoryIcon: "🛒", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.groceries", amount: 925_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-04", month: HOOK_DEMO_MONTH, day: 10, categoryName: "Thực phẩm & Ăn uống hàng ngày", categoryIcon: "🍱", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.officeLunch", amount: 170_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-05", month: HOOK_DEMO_MONTH, day: 24, categoryName: "Thực phẩm & Ăn uống hàng ngày", categoryIcon: "🍱", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.officeLunch", amount: 170_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-06", month: HOOK_DEMO_MONTH, day: 5, categoryName: "Giáo dục", categoryIcon: "🎓", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.tuition", amount: 2_500_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-07", month: HOOK_DEMO_MONTH, day: 8, categoryName: "Nhà ở & Điện nước", categoryIcon: "🏠", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.electricity", amount: 650_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-08", month: HOOK_DEMO_MONTH, day: 8, categoryName: "Nhà ở & Điện nước", categoryIcon: "🚰", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.water", amount: 180_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-09", month: HOOK_DEMO_MONTH, day: 3, categoryName: "Phương tiện xe cơ cố định", categoryIcon: "⛽", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.gas", amount: 240_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-10", month: HOOK_DEMO_MONTH, day: 17, categoryName: "Phương tiện xe cơ cố định", categoryIcon: "⛽", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.gas", amount: 240_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-11", month: HOOK_DEMO_MONTH, day: 1, categoryName: "Phương tiện xe cơ cố định", categoryIcon: "🅿️", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.parking", amount: 500_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-12", month: HOOK_DEMO_MONTH, day: 2, categoryName: "Ăn uống ngoài", categoryIcon: "☕", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.morningCoffee", amount: 70_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-13", month: HOOK_DEMO_MONTH, day: 9, categoryName: "Ăn uống ngoài", categoryIcon: "☕", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.morningCoffee", amount: 70_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-14", month: HOOK_DEMO_MONTH, day: 16, categoryName: "Ăn uống ngoài", categoryIcon: "☕", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.morningCoffee", amount: 70_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-15", month: HOOK_DEMO_MONTH, day: 23, categoryName: "Ăn uống ngoài", categoryIcon: "☕", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.morningCoffee", amount: 70_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-16", month: HOOK_DEMO_MONTH, day: 13, categoryName: "Ăn uống ngoài", categoryIcon: "🍲", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.familyDinner", amount: 225_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-17", month: HOOK_DEMO_MONTH, day: 27, categoryName: "Ăn uống ngoài", categoryIcon: "🍲", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.familyDinner", amount: 225_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-18", month: HOOK_DEMO_MONTH, day: 14, categoryName: "Giải trí", categoryIcon: "🎬", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.movie", amount: 220_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-19", month: HOOK_DEMO_MONTH, day: 11, categoryName: "Chăm sóc cá nhân", categoryIcon: "💇", categoryGroup: "variable", descriptionKey: "setupV2.hook.demo.tx.haircut", amount: 150_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-20", month: HOOK_DEMO_MONTH, day: 19, categoryName: "Chăm sóc cá nhân", categoryIcon: "💄", categoryGroup: "variable", descriptionKey: "setupV2.hook.demo.tx.cosmetics", amount: 450_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-21", month: HOOK_DEMO_MONTH, day: 22, categoryName: "Quà tặng & Hiếu hỉ", categoryIcon: "🎁", categoryGroup: "variable", descriptionKey: "setupV2.hook.demo.tx.birthdayGift", amount: 300_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-22", month: HOOK_DEMO_MONTH, day: 15, categoryName: "Thiết bị/Đồ dùng/Nhà cửa", categoryIcon: "🍳", categoryGroup: "variable", descriptionKey: "setupV2.hook.demo.tx.kitchenware", amount: 500_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-23", month: HOOK_DEMO_MONTH, day: 1, categoryName: "Tiết kiệm", categoryIcon: "💰", categoryGroup: "savings_investment", descriptionKey: "setupV2.hook.demo.tx.savingsDeposit", amount: 1_200_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-24", month: HOOK_DEMO_MONTH, day: 2, categoryName: "Đầu tư", categoryIcon: "📈", categoryGroup: "savings_investment", descriptionKey: "setupV2.hook.demo.tx.stockPurchase", amount: 712_500, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-25", month: HOOK_DEMO_MONTH, day: 5, categoryName: "Chi trả nợ", categoryIcon: "💳", categoryGroup: "debt_repayment", descriptionKey: "setupV2.hook.demo.tx.carLoan", amount: 1_020_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-06-26", month: HOOK_DEMO_MONTH, day: 28, categoryName: "Chênh lệch ghi chép", categoryIcon: "📋", categoryGroup: "other", descriptionKey: "setupV2.hook.demo.tx.misc", amount: 480_000, direction: "out", transactionType: "expense" },

  // Tháng 5/2026 (tháng trước — chỉ dùng cho lastMonth* + độ phong phú recentTransactions)
  { id: "demo-tx-05-01", month: LAST_MONTH, day: 1, categoryName: "Thu nhập", categoryIcon: "💵", categoryGroup: null, descriptionKey: "setupV2.hook.demo.tx.salary", amount: HOOK_DEMO_MONTHLY_INCOME, direction: "in", transactionType: "income" },
  { id: "demo-tx-05-02", month: LAST_MONTH, day: 16, categoryName: "Thực phẩm & Ăn uống hàng ngày", categoryIcon: "🛒", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.groceries", amount: 900_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-03", month: LAST_MONTH, day: 5, categoryName: "Giáo dục", categoryIcon: "🎓", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.tuition", amount: 2_500_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-04", month: LAST_MONTH, day: 8, categoryName: "Nhà ở & Điện nước", categoryIcon: "🏠", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.electricity", amount: 700_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-05", month: LAST_MONTH, day: 10, categoryName: "Phương tiện xe cơ cố định", categoryIcon: "⛽", categoryGroup: "fixed", descriptionKey: "setupV2.hook.demo.tx.gas", amount: 250_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-06", month: LAST_MONTH, day: 6, categoryName: "Ăn uống ngoài", categoryIcon: "☕", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.morningCoffee", amount: 60_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-07", month: LAST_MONTH, day: 13, categoryName: "Ăn uống ngoài", categoryIcon: "☕", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.morningCoffee", amount: 60_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-08", month: LAST_MONTH, day: 20, categoryName: "Ăn uống ngoài", categoryIcon: "☕", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.morningCoffee", amount: 60_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-09", month: LAST_MONTH, day: 18, categoryName: "Ăn uống ngoài", categoryIcon: "🍲", categoryGroup: "wasteful", descriptionKey: "setupV2.hook.demo.tx.familyDinner", amount: 400_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-10", month: LAST_MONTH, day: 11, categoryName: "Chăm sóc cá nhân", categoryIcon: "💇", categoryGroup: "variable", descriptionKey: "setupV2.hook.demo.tx.haircut", amount: 150_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-11", month: LAST_MONTH, day: 1, categoryName: "Tiết kiệm", categoryIcon: "💰", categoryGroup: "savings_investment", descriptionKey: "setupV2.hook.demo.tx.savingsDeposit", amount: 1_200_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-12", month: LAST_MONTH, day: 2, categoryName: "Đầu tư", categoryIcon: "📈", categoryGroup: "savings_investment", descriptionKey: "setupV2.hook.demo.tx.stockPurchase", amount: 700_000, direction: "out", transactionType: "expense" },
  { id: "demo-tx-05-13", month: LAST_MONTH, day: 5, categoryName: "Chi trả nợ", categoryIcon: "💳", categoryGroup: "debt_repayment", descriptionKey: "setupV2.hook.demo.tx.carLoan", amount: 1_020_000, direction: "out", transactionType: "expense" },
]

function sumAmount(transactions: SeedTx[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0)
}

function buildBudgetLines(juneExpenses: SeedTx[], locale: Locale): BudgetActualLine[] {
  const groups: CostTypeGroupKey[] = ["fixed", "variable", "wasteful", "savings_investment", "debt_repayment", "other"]
  return groups.map((group) => {
    const budgetPct = BUDGET_TEMPLATE.filter((line) => line.costTypeGroup === group).reduce((sum, line) => sum + line.budgetPct, 0)
    const budgetAmount = Math.round((HOOK_DEMO_MONTHLY_INCOME * budgetPct) / 100)
    const actualAmount = sumAmount(juneExpenses.filter((tx) => tx.categoryGroup === group))
    return {
      cost_type_id: group,
      cost_type_code: group,
      cost_type_name: COST_TYPE_GROUP_LABELS[group][locale],
      budget_pct: budgetPct,
      override_pct: null,
      effective_pct: budgetPct,
      budget_amount: budgetAmount,
      actual_amount: actualAmount,
      remaining: budgetAmount - actualAmount,
      usage_pct: Math.round((actualAmount / budgetAmount) * 1000) / 10,
    }
  })
}

function buildSpendingByBehavior(juneExpenses: SeedTx[]): SpendingByBehavior[] {
  const behaviors: Array<"fixed" | "variable" | "wasteful"> = ["fixed", "variable", "wasteful"]
  const totals = behaviors.map((behavior) => sumAmount(juneExpenses.filter((tx) => tx.categoryGroup === behavior)))
  const sumAll = totals.reduce((sum, n) => sum + n, 0)
  return behaviors.map((behavior_type, i) => ({
    behavior_type,
    total: totals[i],
    percentage: Math.round((totals[i] / sumAll) * 1000) / 10,
  }))
}

function buildTopExpenseCategories(juneExpenses: SeedTx[], totalExpense: number): TopExpenseCategory[] {
  const byCategory = new Map<string, { amount: number; icon: string }>()
  for (const tx of juneExpenses) {
    const existing = byCategory.get(tx.categoryName)
    byCategory.set(tx.categoryName, { amount: (existing?.amount ?? 0) + tx.amount, icon: tx.categoryIcon })
  }
  return Array.from(byCategory.entries())
    .map(([name, { amount, icon }]) => ({ name, icon, amount, pct: Math.round((amount / totalExpense) * 1000) / 10 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
}

function buildWeekdaySpending(juneExpenses: SeedTx[]): WeekdaySpending[] {
  const totals = new Array(7).fill(0) as number[]
  for (const tx of juneExpenses) {
    // Constructor local, không parse string: new Date("yyyy-mm-dd") là UTC midnight,
    // .getDay() local sẽ lệch 1 ngày ở timezone âm
    const [txYear, txMonth] = tx.month.split("-").map(Number)
    const day = new Date(txYear, txMonth - 1, tx.day).getDay()
    totals[day] += tx.amount
  }
  return totals.map((amount, day) => ({ day, amount }))
}

function buildTransactions(t: TFunction): TransactionWithJoins[] {
  return [...SEED_TRANSACTIONS]
    .sort((a, b) => `${b.month}-${b.day}`.localeCompare(`${a.month}-${a.day}`))
    .map((tx) => {
      const dateStr = `${tx.month}-${String(tx.day).padStart(2, "0")}`
      return {
        id: tx.id,
        household_id: "demo-household",
        member_id: "demo-member-1",
        amount: tx.amount,
        direction: tx.direction,
        transaction_type: tx.transactionType,
        category_id: `demo-cat-${tx.categoryName}`,
        account_id: "demo-account-1",
        fund_id: null,
        debt_entry_id: null,
        behavior_type: tx.categoryGroup === "fixed" || tx.categoryGroup === "variable" || tx.categoryGroup === "wasteful" ? tx.categoryGroup : null,
        is_unusual_income: false,
        exclude_from_budget_report: false,
        description: t(tx.descriptionKey),
        transaction_date: dateStr,
        created_at: `${dateStr}T08:00:00.000Z`,
        updated_at: `${dateStr}T08:00:00.000Z`,
        category: { id: `demo-cat-${tx.categoryName}`, name: tx.categoryName, icon: tx.categoryIcon },
        account: { id: "demo-account-1", name: t("setupV2.hook.demo.account"), color: null },
      }
    })
}

function buildFunds(t: TFunction): Fund[] {
  const emergencyTarget = estimateEmergencyTarget(HOOK_DEMO_MONTHLY_INCOME)
  return [
    {
      id: "demo-fund-goal",
      household_id: "demo-household",
      name: t("setupV2.hook.demo.fund.goal"),
      description: null,
      fund_type: "goal",
      current_balance: 8_600_000,
      target_amount: 20_000_000,
      monthly_contribution: null,
      contribution_day: 1,
      expected_return_rate: null,
      target_date: "2027-06-01",
      target_months_expense: null,
      reset_monthly: false,
      release_trigger: null,
      released_at: null,
      color: null,
      icon: null,
      is_active: true,
      priority: 1,
      priority_rank: 1,
      per_member: false,
      amount_per_member: null,
      sort_order: 1,
      created_at: "2026-01-05T00:00:00+07:00",
    },
    {
      id: "demo-fund-emergency",
      household_id: "demo-household",
      name: t("setupV2.hook.demo.fund.emergency"),
      description: null,
      fund_type: "emergency",
      current_balance: Math.round((emergencyTarget * 0.3) / 100_000) * 100_000,
      target_amount: emergencyTarget,
      monthly_contribution: null,
      contribution_day: 1,
      expected_return_rate: null,
      target_date: null,
      target_months_expense: 3,
      reset_monthly: false,
      release_trigger: null,
      released_at: null,
      color: null,
      icon: null,
      is_active: true,
      priority: 2,
      priority_rank: null,
      per_member: false,
      amount_per_member: null,
      sort_order: 2,
      created_at: "2026-01-05T00:00:00+07:00",
    },
  ]
}

export function buildHookDemoData(t: TFunction, locale: Locale): DashboardData {
  const june = SEED_TRANSACTIONS.filter((tx) => tx.month === HOOK_DEMO_MONTH)
  const may = SEED_TRANSACTIONS.filter((tx) => tx.month === LAST_MONTH)
  const juneExpenses = june.filter((tx) => tx.direction === "out")
  const totalIncome = sumAmount(june.filter((tx) => tx.direction === "in"))
  const totalExpense = sumAmount(juneExpenses)
  const lastMonthIncome = sumAmount(may.filter((tx) => tx.direction === "in"))
  const lastMonthExpense = sumAmount(may.filter((tx) => tx.direction === "out"))
  // Demo không có giao dịch góp quỹ thật → coi phần dư là số đã tiết kiệm để card hiển thị hợp lý.
  const fundContributions = Math.max(totalIncome - totalExpense, 0)

  const year = HOOK_DEMO_MONTH.split("-")[0]
  const demoMonthNum = Number(HOOK_DEMO_MONTH.split("-")[1])
  const monthlyIncomeExpense = Array.from({ length: demoMonthNum }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`
    const txs = SEED_TRANSACTIONS.filter((tx) => tx.month === key)
    return {
      month: key,
      income: sumAmount(txs.filter((tx) => tx.transactionType === "income")),
      expense: sumAmount(txs.filter((tx) => tx.transactionType === "expense")),
    }
  })

  return {
    totalIncome,
    totalExpense,
    fundContributions,
    savingsRate: totalIncome > 0 ? Math.round((fundContributions / totalIncome) * 1000) / 10 : 0,
    lastMonthIncome,
    lastMonthExpense,
    netWorth: null,
    spendingByBehavior: buildSpendingByBehavior(juneExpenses),
    budgetLines: buildBudgetLines(juneExpenses, locale),
    funds: buildFunds(t),
    recentTransactions: buildTransactions(t),
    topExpenseCategories: buildTopExpenseCategories(juneExpenses, totalExpense),
    weekdaySpending: buildWeekdaySpending(juneExpenses),
    monthlyIncomeExpense,
    hasAnyTransactionEver: true,
    // Demo phải có "hôm qua" dưới kế hoạch — banner khoe insight tích cực,
    // không phải copy "chưa có ghi chép nào"
    yesterdayTransactions: [{ amount: 120_000, direction: "out", behavior_type: "variable" }],
    activeDaysLast7: 0,
  }
}
