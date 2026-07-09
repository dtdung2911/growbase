import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { todayVN } from "@/lib/utils/date"

export async function POST() {
  const auth = await withAuth()
  if (auth.error) return auth.error

  const { error } = await auth.supabase
    .from("member_activity")
    .upsert(
      {
        household_id: auth.householdId,
        user_id: auth.user.id,
        active_date: todayVN(),
      },
      { onConflict: "user_id,active_date", ignoreDuplicates: true }
    )

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { recorded: true }, error: null })
}
