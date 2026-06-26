import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { monthRange } from "@/lib/utils/date"
import type { DashboardData, SpendingByBehavior, BehaviorType } from "@/types/app"

export async function GET(request: NextRequest) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const month = request.nextUrl.searchParams.get("month")
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { data: null, error: "Tháng không hợp lệ (YYYY-MM)" },
      { status: 400 }
    )
  }

  const { from, to } = monthRange(month)
  const hid = auth.householdId

  const [txResult, budgetResult, fundsResult] = await Promise.all([
    auth.supabase
      .from("transactions")
      .select(
        "id, amount, direction, transaction_type, behavior_type, is_unusual_income, exclude_from_budget_report, description, transaction_date, category_id, account_id, fund_id, categories(id, name, icon), accounts(id, name, color)"
      )
      .eq("household_id", hid)
      .gte("transaction_date", from)
      .lte("transaction_date", to)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    auth.supabase.rpc("get_budget_with_actuals", {
      p_household_id: hid,
      p_month: month,
    }),
    auth.supabase
      .from("funds")
      .select("*")
      .eq("household_id", hid)
      .eq("is_active", true)
      .order("sort_order"),
  ])

  if (txResult.error) {
    return NextResponse.json(
      { data: null, error: txResult.error.message },
      { status: 500 }
    )
  }

  const transactions = txResult.data ?? []

  let totalIncome = 0
  let totalExpense = 0
  const behaviorTotals: Record<string, number> = {}

  for (const tx of transactions) {
    if (tx.direction === "in") {
      totalIncome += tx.amount
    } else {
      totalExpense += tx.amount
      if (tx.behavior_type && !tx.exclude_from_budget_report) {
        behaviorTotals[tx.behavior_type] =
          (behaviorTotals[tx.behavior_type] ?? 0) + tx.amount
      }
    }
  }

  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10
    : 0

  const spendingByBehavior: SpendingByBehavior[] = Object.entries(behaviorTotals).map(
    ([bt, total]) => ({
      behavior_type: bt as BehaviorType,
      total,
      percentage: totalExpense > 0
        ? Math.round((total / totalExpense) * 1000) / 10
        : 0,
    })
  )

  const recentTransactions = transactions.slice(0, 5).map((row) => {
    const { categories: cat, accounts: acc, ...rest } = row as Record<string, unknown>
    return { ...rest, category: cat ?? null, account: acc ?? null }
  })

  const budgetLines = Array.isArray(budgetResult.data)
    ? budgetResult.data
    : []

  const dashboard: DashboardData = {
    totalIncome,
    totalExpense,
    savingsRate,
    spendingByBehavior,
    budgetLines: budgetLines as DashboardData["budgetLines"],
    funds: (fundsResult.data ?? []) as DashboardData["funds"],
    recentTransactions: recentTransactions as DashboardData["recentTransactions"],
  }

  return NextResponse.json({ data: dashboard, error: null })
}
