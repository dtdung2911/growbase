import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"

export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("net_worth_snapshots")
    .select("snapshot_month, total_recorded, total_system, discrepancy")
    .eq("household_id", auth.householdId)
    .order("snapshot_month")

  if (error) {
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: data ?? [], error: null })
}
