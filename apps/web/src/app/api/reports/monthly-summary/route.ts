import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"

export type MonthlySummaryRow = {
  month: string
  totalIncome: number
  totalExpense: number
  // 19-7: phần tổng chi lấy từ quỹ (expense có fund_id) — phần còn lại là từ thu nhập
  expenseFromFund: number
  expenseRatio: number
  savings: number
  savingsRate: number
  byBehavior: Record<string, { total: number; pct: number }>
}

export async function GET(request: NextRequest) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const months = Number(request.nextUrl.searchParams.get("months") ?? "6")
  const hid = auth.householdId

  const now = new Date()
  const monthList: string[] = []
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthList.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  const startDate = `${monthList[monthList.length - 1]}-01`
  const endMonth = monthList[0]
  const endDate = new Date(
    Number(endMonth.split("-")[0]),
    Number(endMonth.split("-")[1]),
    0
  )
  const endDateStr = endDate.toISOString().split("T")[0]

  const { data: txs, error } = await auth.supabase
    .from("transactions")
    .select("amount, direction, behavior_type, transaction_date, exclude_from_budget_report, transaction_type, fund_id")
    .eq("household_id", hid)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDateStr)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  const byMonth = new Map<string, MonthlySummaryRow>()
  for (const m of monthList) {
    byMonth.set(m, {
      month: m,
      totalIncome: 0,
      totalExpense: 0,
      expenseFromFund: 0,
      expenseRatio: 0,
      savings: 0,
      savingsRate: 0,
      byBehavior: {},
    })
  }

  for (const tx of txs ?? []) {
    const txMonth = (tx.transaction_date as string).slice(0, 7)
    const row = byMonth.get(txMonth)
    if (!row) continue

    if (tx.direction === "in") {
      row.totalIncome += tx.amount
    } else {
      row.totalExpense += tx.amount
      if (tx.transaction_type === "expense" && tx.fund_id) {
        row.expenseFromFund += tx.amount
      }
      if (!tx.exclude_from_budget_report && tx.behavior_type) {
        const bt = tx.behavior_type as string
        if (!row.byBehavior[bt]) row.byBehavior[bt] = { total: 0, pct: 0 }
        row.byBehavior[bt].total += tx.amount
      }
    }
  }

  const result: MonthlySummaryRow[] = monthList.map((m) => {
    const row = byMonth.get(m)!
    row.savings = row.totalIncome - row.totalExpense
    row.savingsRate = row.totalIncome > 0
      ? Math.round((row.savings / row.totalIncome) * 1000) / 10
      : 0
    row.expenseRatio = row.totalIncome > 0
      ? Math.round((row.totalExpense / row.totalIncome) * 1000) / 10
      : 0
    for (const bt of Object.keys(row.byBehavior)) {
      row.byBehavior[bt].pct = row.totalIncome > 0
        ? Math.round((row.byBehavior[bt].total / row.totalIncome) * 1000) / 10
        : 0
    }
    return row
  }).reverse()

  return NextResponse.json({ data: result, error: null })
}
