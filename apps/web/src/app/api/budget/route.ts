import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"

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

  const { data, error } = await auth.supabase.rpc("get_budget_with_actuals", {
    p_household_id: auth.householdId,
    p_month: month,
  })

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: data ?? [], error: null })
}
