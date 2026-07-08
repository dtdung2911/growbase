import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { monthRange, todayVN, yesterdayVN } from "@/lib/utils/date"

function prevMonth(month: string) {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(request: NextRequest) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const month = request.nextUrl.searchParams.get("month")
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ data: null, error: "month param required (YYYY-MM)" }, { status: 400 })
  }

  const hid = auth.householdId
  const { supabase } = auth
  const { from, to } = monthRange(month)
  const prev = prevMonth(month)
  const { from: prevFrom, to: prevTo } = monthRange(prev)

  // Fetch current + prev month transactions in one query
  const { data: allTxs, error: txErr } = await supabase
    .from("transactions")
    .select(`
      id, amount, direction, behavior_type, transaction_date,
      exclude_from_budget_report,
      category:categories(id, name, icon)
    `)
    .eq("household_id", hid)
    .gte("transaction_date", prevFrom)
    .lte("transaction_date", to)

  if (txErr) {
    return NextResponse.json({ data: null, error: txErr.message }, { status: 500 })
  }

  const currentTxs = (allTxs ?? []).filter(
    (tx) => tx.transaction_date >= from && tx.transaction_date <= to
  )

  // Query riêng cho "hôm qua" (theo giờ VN): allTxs chỉ phủ tháng đang xem + tháng trước,
  // nên khi user xem tháng khác thì hôm qua thật nằm ngoài cửa sổ đã fetch
  const { data: yesterdayTxs, error: yErr } = await supabase
    .from("transactions")
    .select("amount, direction, behavior_type")
    .eq("household_id", hid)
    .eq("transaction_date", yesterdayVN())
    .eq("exclude_from_budget_report", false)

  if (yErr) {
    return NextResponse.json({ data: null, error: yErr.message }, { status: 500 })
  }
  const yesterdayTransactions = yesterdayTxs ?? []
  const prevTxs = (allTxs ?? []).filter(
    (tx) => tx.transaction_date >= prevFrom && tx.transaction_date <= prevTo
  )

  // Aggregates
  let totalIncome = 0
  let totalExpense = 0
  let lastMonthIncome = 0
  let lastMonthExpense = 0
  const behaviorMap = new Map<string, number>()
  const categoryMap = new Map<string, { name: string; icon: string | null; amount: number }>()
  const weekdayMap = new Map<number, number>()

  for (const tx of currentTxs) {
    const amt = tx.amount as number
    const dir = tx.direction as string

    if (dir === "in") {
      totalIncome += amt
    } else {
      totalExpense += amt
      // behavior breakdown
      if (!tx.exclude_from_budget_report && tx.behavior_type) {
        behaviorMap.set(tx.behavior_type, (behaviorMap.get(tx.behavior_type) ?? 0) + amt)
      }
      // top categories
      const cat = tx.category as unknown as { id: string; name: string; icon: string | null } | null
      if (cat) {
        const existing = categoryMap.get(cat.id)
        if (existing) {
          existing.amount += amt
        } else {
          categoryMap.set(cat.id, { name: cat.name, icon: cat.icon, amount: amt })
        }
      }
      // weekday
      const dow = new Date(tx.transaction_date as string).getDay()
      weekdayMap.set(dow, (weekdayMap.get(dow) ?? 0) + amt)
    }
  }

  for (const tx of prevTxs) {
    const amt = tx.amount as number
    if (tx.direction === "in") lastMonthIncome += amt
    else lastMonthExpense += amt
  }

  const savings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 1000) / 10 : 0

  const BEHAVIOR_ORDER = ["fixed", "essential_variable", "lifestyle", "wasteful", "savings_investment"]
  const BEHAVIOR_COLORS: Record<string, string> = {
    fixed: "#0084DB",
    essential_variable: "#49c8e6",
    lifestyle: "#9b78ff",
    wasteful: "#ff917d",
    savings_investment: "#49d68d",
  }
  const spendingByBehavior = BEHAVIOR_ORDER
    .filter((b) => behaviorMap.has(b))
    .map((b) => ({
      behavior: b,
      amount: behaviorMap.get(b)!,
      color: BEHAVIOR_COLORS[b] ?? "#a5b1c2",
    }))

  const topExpenseCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map((c) => ({
      ...c,
      pct: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 1000) / 10 : 0,
    }))

  const weekdaySpending = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    amount: weekdayMap.get(i) ?? 0,
  }))

  // Budget lines
  const { data: budgetData, error: budgetErr } = await supabase.rpc("get_budget_with_actuals", {
    p_household_id: hid,
    p_month: month,
  })

  // Has this household ever recorded a transaction (any month) — distinguishes
  // a genuine day-0 household from one simply viewing an empty month
  const { count: transactionCount, error: countErr } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("household_id", hid)

  // Funds
  const { data: fundsData, error: fundsErr } = await supabase
    .from("funds")
    .select("id, name, fund_type, color, target_amount, current_balance, monthly_contribution, created_at, target_date")
    .eq("household_id", hid)
    .eq("is_active", true)
    .order("sort_order")

  // Recent transactions
  const { data: recentTxs, error: recentErr } = await supabase
    .from("transactions")
    .select(`
      id, amount, direction, transaction_date, description, behavior_type,
      category:categories(id, name, icon),
      account:accounts(id, name)
    `)
    .eq("household_id", hid)
    .gte("transaction_date", from)
    .lte("transaction_date", to)
    .order("transaction_date", { ascending: false })
    .limit(10)

  // Số ngày user hoạt động trong 7 ngày gần nhất (gồm hôm nay). PK (user_id, active_date)
  // đảm bảo mỗi ngày 1 row → count = COUNT(DISTINCT active_date) (Story 7.2)
  const activityCutoff = new Date(todayVN() + "T00:00:00Z")
  activityCutoff.setUTCDate(activityCutoff.getUTCDate() - 6)
  const { count: activeDaysLast7, error: activityErr } = await supabase
    .from("member_activity")
    .select("active_date", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .gte("active_date", activityCutoff.toISOString().slice(0, 10))

  // Net worth (latest snapshot — use total_system as best estimate)
  const { data: nwSnapshot, error: nwErr } = await supabase
    .from("net_worth_snapshots")
    .select("total_system, total_recorded")
    .eq("household_id", hid)
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Lỗi fetch phải nổ ra 500, không được im lặng biến thành "day-zero" giả
  const fetchErr = budgetErr ?? countErr ?? fundsErr ?? recentErr ?? nwErr ?? activityErr
  if (fetchErr) {
    return NextResponse.json({ data: null, error: fetchErr.message }, { status: 500 })
  }

  const netWorth = nwSnapshot
    ? ((nwSnapshot.total_recorded as number) || (nwSnapshot.total_system as number) || null)
    : null

  return NextResponse.json({
    data: {
      totalIncome,
      totalExpense,
      savingsRate,
      lastMonthIncome,
      lastMonthExpense,
      netWorth,
      spendingByBehavior,
      budgetLines: budgetData ?? [],
      funds: fundsData ?? [],
      recentTransactions: recentTxs ?? [],
      topExpenseCategories,
      weekdaySpending,
      hasAnyTransactionEver: (transactionCount ?? 0) > 0,
      yesterdayTransactions,
      activeDaysLast7: activeDaysLast7 ?? 0,
    },
    error: null,
  })
}
