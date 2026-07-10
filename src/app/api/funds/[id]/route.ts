import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { updateFundSchema } from "@/lib/validations/fund"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const [fundResult, historyResult] = await Promise.all([
    auth.supabase
      .from("funds")
      .select("*")
      .eq("id", params.id)
      .eq("household_id", auth.householdId)
      .single(),
    auth.supabase
      .from("fund_transactions")
      .select("*")
      .eq("fund_id", params.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  if (fundResult.error) {
    return NextResponse.json(
      { data: null, error: "Không tìm thấy quỹ" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    data: { fund: fundResult.data, history: historyResult.data ?? [] },
    error: null,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = updateFundSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  // BR-OB-016: rank chỉ áp cho goal fund. Chặn set priority_rank lên emergency/quỹ khác.
  if (parsed.data.priority_rank !== undefined) {
    const { data: target } = await auth.supabase
      .from("funds")
      .select("fund_type")
      .eq("id", params.id)
      .eq("household_id", auth.householdId)
      .maybeSingle()
    if (!target) {
      return NextResponse.json({ data: null, error: "Không tìm thấy quỹ" }, { status: 404 })
    }
    if (target.fund_type !== "goal") {
      return NextResponse.json(
        { data: null, error: "Chỉ quỹ mục tiêu mới có hạng ưu tiên" },
        { status: 400 }
      )
    }
  }

  const { data, error } = await auth.supabase
    .from("funds")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("household_id", auth.householdId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data: fund } = await auth.supabase
    .from("funds")
    .select("current_balance")
    .eq("id", params.id)
    .eq("household_id", auth.householdId)
    .single()

  if (!fund) {
    return NextResponse.json({ data: null, error: "Không tìm thấy quỹ" }, { status: 404 })
  }

  if (fund.current_balance > 0) {
    return NextResponse.json(
      { data: null, error: "Không thể xóa quỹ còn số dư. Rút hết trước khi xóa." },
      { status: 409 }
    )
  }

  const { error } = await auth.supabase
    .from("funds")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("household_id", auth.householdId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: params.id }, error: null })
}
