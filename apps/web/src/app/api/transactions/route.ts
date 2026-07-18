import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { createTransactionSchema } from "@growbase/shared/schemas/transaction"
import { monthRange } from "@growbase/shared/rules/date"

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

  const { data, error } = await auth.supabase
    .from("transactions")
    .select(
      "id, household_id, member_id, amount, direction, transaction_type, category_id, account_id, fund_id, debt_entry_id, behavior_type, is_unusual_income, exclude_from_budget_report, description, transaction_date, created_at, updated_at, categories(id, name, icon), accounts(id, name, color), funds(id, name)"
    )
    .eq("household_id", auth.householdId)
    .gte("transaction_date", from)
    .lte("transaction_date", to)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  const rows = (data ?? []).map((row) => {
    const { categories: cat, accounts: acc, funds: fund, ...rest } = row as Record<string, unknown>
    return { ...rest, category: cat ?? null, account: acc ?? null, fund: fund ?? null }
  })

  return NextResponse.json({ data: rows, error: null })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {

    const body = await request.json().catch(() => null)
    const parsed = createTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const input = parsed.data

    const { data, error } = await auth.supabase
      .from("transactions")
      .insert({
        household_id: auth.householdId,
        member_id: auth.memberId,
        amount: input.amount,
        direction: input.direction,
        transaction_type: input.transaction_type,
        category_id: input.category_id,
        account_id: input.account_id,
        description: input.description ?? null,
        transaction_date: input.transaction_date,
        is_unusual_income: input.is_unusual_income,
        debt_entry_id: input.debt_entry_id ?? null,
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { id: data.id }, error: null }, { status: 201 })
  })
}
