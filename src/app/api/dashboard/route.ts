import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { monthRange, todayVN, yesterdayVN } from "@/lib/utils/date"
import type { BehaviorType, SpendingByBehavior } from "@/types/app"

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
      id, amount, direction, transaction_type, behavior_type, transaction_date,
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
  let fundContributions = 0
  let lastMonthIncome = 0
  let lastMonthExpense = 0
  const behaviorMap = new Map<string, number>()
  const categoryMap = new Map<string, { name: string; icon: string | null; amount: number }>()
  const weekdayMap = new Map<number, number>()

  // Phân loại theo transaction_type (không theo direction): góp/rút quỹ đều là direction 'out'
  // nên direction gộp chúng vào chi tiêu — sai. Chi tiêu thật = expense + debt_repayment;
  // fund_contribution = tiết kiệm (tách riêng); fund_withdrawal + internal_transfer chỉ luân
  // chuyển nội bộ (không thu, không chi) → bỏ hoàn toàn khỏi thu/chi.
  for (const tx of currentTxs) {
    const amt = tx.amount as number
    const type = tx.transaction_type as string

    if (type === "income") {
      totalIncome += amt
      continue
    }

    if (type === "fund_contribution") fundContributions += amt

    const isRealExpense = type === "expense" || type === "debt_repayment"
    if (isRealExpense) totalExpense += amt

    // Donut phân bổ gồm cả chi tiêu thật lẫn góp quỹ (savings_investment);
    // fund_withdrawal/internal_transfer đã bị trigger đánh exclude_from_budget_report=true.
    if (
      (isRealExpense || type === "fund_contribution") &&
      !tx.exclude_from_budget_report &&
      tx.behavior_type
    ) {
      behaviorMap.set(tx.behavior_type, (behaviorMap.get(tx.behavior_type) ?? 0) + amt)
    }

    // Top categories + weekday chỉ tính chi tiêu thật để khớp totalExpense.
    if (isRealExpense) {
      const cat = tx.category as unknown as { id: string; name: string; icon: string | null } | null
      if (cat) {
        const existing = categoryMap.get(cat.id)
        if (existing) {
          existing.amount += amt
        } else {
          categoryMap.set(cat.id, { name: cat.name, icon: cat.icon, amount: amt })
        }
      }
      const dow = new Date(tx.transaction_date as string).getDay()
      weekdayMap.set(dow, (weekdayMap.get(dow) ?? 0) + amt)
    }
  }

  for (const tx of prevTxs) {
    const amt = tx.amount as number
    const type = tx.transaction_type as string
    if (type === "income") lastMonthIncome += amt
    else if (type === "expense" || type === "debt_repayment") lastMonthExpense += amt
  }

  // Tỷ lệ tiết kiệm = phần thu nhập đã góp vào quỹ (không phải thu - chi).
  const savingsRate =
    totalIncome > 0 ? Math.min(100, Math.round((fundContributions / totalIncome) * 1000) / 10) : 0

  const BEHAVIOR_ORDER: BehaviorType[] = [
    "fixed",
    "variable",
    "wasteful",
    "debt_repayment",
    "savings_investment",
    "loan",
  ]
  const behaviorTotal = Array.from(behaviorMap.values()).reduce((a, b) => a + b, 0)
  const spendingByBehavior: SpendingByBehavior[] = BEHAVIOR_ORDER
    .filter((b) => behaviorMap.has(b))
    .map((b) => {
      const total = behaviorMap.get(b)!
      return {
        behavior_type: b,
        total,
        percentage: behaviorTotal > 0 ? Math.round((total / behaviorTotal) * 100) : 0,
      }
    })

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

  // Thu/chi mỗi tháng từ đầu năm → tháng đang xem, cho chart "Thu nhập vs Chi tiêu"
  const year = month.split("-")[0]
  const currentMonthNum = Number(month.split("-")[1])
  const { data: yearTxs, error: yearTxErr } = await supabase
    .from("transactions")
    .select("transaction_date, amount, transaction_type")
    .eq("household_id", hid)
    .gte("transaction_date", `${year}-01-01`)
    .lte("transaction_date", to)

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
    .select("id, name, fund_type, icon, color, target_amount, current_balance, monthly_contribution, created_at, target_date")
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
    .eq("household_id", hid)
    .gte("active_date", activityCutoff.toISOString().slice(0, 10))
    .lte("active_date", todayVN())

  // Net worth (latest snapshot — use total_system as best estimate)
  const { data: nwSnapshot, error: nwErr } = await supabase
    .from("net_worth_snapshots")
    .select("total_system, total_recorded")
    .eq("household_id", hid)
    .order("snapshot_month", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Lỗi fetch phải nổ ra 500, không được im lặng biến thành "day-zero" giả
  const fetchErr = budgetErr ?? countErr ?? fundsErr ?? recentErr ?? nwErr ?? yearTxErr
  if (fetchErr) {
    return NextResponse.json({ data: null, error: fetchErr.message }, { status: 500 })
  }

  // Counter trang trí — lỗi không được đánh sập cả dashboard, chỉ log rồi coi như 0
  if (activityErr) {
    console.error("member_activity count failed:", activityErr.message)
  }

  const netWorth = nwSnapshot
    ? ((nwSnapshot.total_recorded as number) || (nwSnapshot.total_system as number) || null)
    : null

  const monthlyIncomeExpense = Array.from({ length: currentMonthNum }, (_, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    income: 0,
    expense: 0,
  }))
  for (const tx of yearTxs ?? []) {
    const idx = Number((tx.transaction_date as string).slice(5, 7)) - 1
    const bucket = monthlyIncomeExpense[idx]
    if (!bucket) continue
    const amt = tx.amount as number
    const type = tx.transaction_type as string
    if (type === "income") bucket.income += amt
    else if (type === "expense" || type === "debt_repayment") bucket.expense += amt
  }

  return NextResponse.json({
    data: {
      totalIncome,
      totalExpense,
      fundContributions,
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
      monthlyIncomeExpense,
      hasAnyTransactionEver: (transactionCount ?? 0) > 0,
      yesterdayTransactions,
      activeDaysLast7: activeDaysLast7 ?? 0,
    },
    error: null,
  })
}
