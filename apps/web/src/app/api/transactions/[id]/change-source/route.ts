import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"

type Params = { params: { id: string } }

const changeSourceSchema = z.object({ fund_id: z.string().uuid().nullable() })

export async function POST(request: Request, { params }: Params) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json(
        { data: null, error: "Transaction ID không hợp lệ" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = changeSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    // R1: đổi nguồn tiền đụng số dư quỹ = atomic RPC only
    const { error } = await auth.supabase.rpc("transaction_change_fund_source", {
      p_household_id: auth.householdId,
      p_transaction_id: params.id,
      p_fund_id: parsed.data.fund_id,
    })

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { changed: true }, error: null })
  })
}
