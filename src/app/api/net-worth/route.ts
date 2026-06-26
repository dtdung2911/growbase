import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { netWorthSnapshotSchema } from "@/lib/validations/net-worth"

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

  const snapshotMonth = month + "-01"
  const hid = auth.householdId

  const [snapshotResult, balancesResult, fundsResult] = await Promise.all([
    auth.supabase
      .from("net_worth_snapshots")
      .select("*")
      .eq("household_id", hid)
      .eq("snapshot_month", snapshotMonth)
      .maybeSingle(),
    auth.supabase.rpc("get_system_balances", { p_household_id: hid }),
    auth.supabase
      .from("funds")
      .select("id, name, current_balance, fund_type")
      .eq("household_id", hid)
      .eq("is_active", true),
  ])

  if (balancesResult.error) {
    return NextResponse.json(
      { data: null, error: balancesResult.error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: {
      snapshot: snapshotResult.data ?? null,
      systemBalances: balancesResult.data ?? [],
      funds: fundsResult.data ?? [],
    },
    error: null,
  })
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  const parsed = netWorthSnapshotSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const input = parsed.data

  const { data, error } = await auth.supabase
    .from("net_worth_snapshots")
    .upsert(
      {
        household_id: auth.householdId,
        snapshot_month: input.snapshot_month,
        items: JSON.parse(JSON.stringify(input.items)),
        total_recorded: input.total_recorded,
        total_system: input.total_system,
        notes: input.notes ?? null,
      },
      { onConflict: "household_id,snapshot_month" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null })
}
