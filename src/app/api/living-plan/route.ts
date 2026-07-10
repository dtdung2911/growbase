import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { monthRange, todayVN } from "@/lib/utils/date"
import { trailingHouseholdIncome } from "@/lib/utils/trailingIncome"

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { supabase, householdId } = auth

  // "Tháng này" = tháng lịch thực (giờ VN), không phải tháng đang duyệt — capacity theo BR-OB-015.
  const currentMonth = todayVN().slice(0, 7)
  // Trailing = 3 tháng ĐỦ (đã hết) gần nhất m-3..m-1, KHÔNG gồm tháng hiện tại: tháng đang dở
  // (lương chưa về) sẽ kéo tụt trailing → timeline nhảy loạn cuối tháng. Capacity dùng riêng tháng này.
  const trailingMonths = [
    addMonths(currentMonth, -3),
    addMonths(currentMonth, -2),
    addMonths(currentMonth, -1),
  ]
  const windowFrom = monthRange(trailingMonths[0]).from
  const windowTo = monthRange(currentMonth).to // gồm cả tháng hiện tại cho currentMonthIncome

  // Drift (BR-OB-017): hộ có góp quỹ nào trong tháng lịch TRƯỚC? head+count → không kéo rows,
  // chỉ cần biết có/không. StageEventCard dùng cờ này để kể tử tế khi tháng trước bỏ trống.
  const lastMonth = monthRange(addMonths(currentMonth, -1))

  const [fundsRes, incomeRes, lastMonthContribRes, householdRes] = await Promise.all([
    supabase
      .from("funds")
      .select("id, name, fund_type, target_amount, current_balance, priority_rank, created_at")
      .eq("household_id", householdId)
      .eq("is_active", true),
    // CHỈ đếm transaction_type='income': fund_withdrawal cũng có direction='in' (rút quỹ về ví),
    // nên lọc theo direction sẽ đội thu nhập lên. Chỉ 'income' mới là thu nhập thực.
    supabase
      .from("transactions")
      .select("amount, transaction_date")
      .eq("household_id", householdId)
      .eq("transaction_type", "income")
      .gte("transaction_date", windowFrom)
      .lte("transaction_date", windowTo),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("transaction_type", "fund_contribution")
      .gte("transaction_date", lastMonth.from)
      .lte("transaction_date", lastMonth.to),
    supabase.from("households").select("created_at").eq("id", householdId).single(),
  ])

  if (fundsRes.error) {
    return NextResponse.json({ data: null, error: fundsRes.error.message }, { status: 500 })
  }
  if (incomeRes.error) {
    return NextResponse.json({ data: null, error: incomeRes.error.message }, { status: 500 })
  }

  const funds = fundsRes.data ?? []
  const emergency = funds.find((f) => f.fund_type === "emergency")
  const emergencyBalance = Number(emergency?.current_balance ?? 0)
  // Target quỹ khẩn cấp = target_amount DB (user-editable, BR-OB-016). null → engine tự estimate theo income.
  const emergencyTargetAmount =
    emergency?.target_amount != null ? Number(emergency.target_amount) : null

  const goals = funds
    .filter((f) => f.fund_type === "goal")
    // Sort deterministic (BR-OB-014): rank trước; khi trùng rank → created_at rồi id để 2 lần
    // fetch luôn cùng thứ tự (không random giữa các request).
    .sort((a, b) => {
      const rank = (a.priority_rank ?? Infinity) - (b.priority_rank ?? Infinity)
      if (rank !== 0) return rank
      const created = String(a.created_at).localeCompare(String(b.created_at))
      if (created !== 0) return created
      return String(a.id).localeCompare(String(b.id))
    })
    .map((f) => ({
      id: f.id as string,
      name: f.name as string,
      targetAmount: Number(f.target_amount ?? 0),
      currentBalance: Number(f.current_balance ?? 0),
      priorityRank: f.priority_rank as number | null,
    }))

  const sumMonthIncome = (mm: string) => {
    const { from, to } = monthRange(mm)
    return (incomeRes.data ?? [])
      .filter((tx) => tx.transaction_date >= from && tx.transaction_date <= to)
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
  }
  const monthlyTotals = trailingMonths.map(sumMonthIncome)
  const currentMonthIncome = sumMonthIncome(currentMonth)

  // Fallback = tổng income_sources hiện hành (income onboarding) — chỉ query khi chưa có thu nhập thực.
  let fallback = 0
  if (!monthlyTotals.some((t) => t > 0)) {
    const { data: sources } = await supabase
      .from("income_sources")
      .select("monthly_amount")
      .eq("household_id", householdId)
      .eq("is_current", true)
    fallback = (sources ?? []).reduce((sum, s) => sum + Number(s.monthly_amount), 0)
  }

  const trailingIncome = trailingHouseholdIncome(monthlyTotals, fallback)
  // Hộ tạo TRONG/SAU đầu tháng trước chưa từng có "tháng trước" để trách → không kể drift (BR-OB-017);
  // lỗi count → im lặng về phía true (không dọa oan). Chỉ báo drift khi chắc chắn tháng trước bỏ trống.
  const householdCreatedAt = householdRes.data?.created_at as string | null | undefined
  const existedBeforeLastMonth =
    householdCreatedAt != null && householdCreatedAt.slice(0, 10) < lastMonth.from
  const contributedLastMonth =
    !existedBeforeLastMonth || lastMonthContribRes.error != null
      ? true
      : (lastMonthContribRes.count ?? 0) > 0

  return NextResponse.json({
    data: {
      trailingIncome,
      currentMonthIncome,
      emergencyBalance,
      emergencyTargetAmount,
      goals,
      contributedLastMonth,
    },
    error: null,
  })
}
