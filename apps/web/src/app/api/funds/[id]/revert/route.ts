import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"

type Params = { params: { id: string } }

const revertSchema = z.object({ fund_tx_id: z.string().uuid() })

export async function POST(request: Request, { params }: Params) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json(
        { data: null, error: "Fund ID không hợp lệ" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = revertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    // R1: Fund ops = RPC only
    const { error } = await auth.supabase.rpc("fund_contribution_revert", {
      p_household_id: auth.householdId,
      p_fund_tx_id: parsed.data.fund_tx_id,
    })

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { reverted: true }, error: null })
  })
}
