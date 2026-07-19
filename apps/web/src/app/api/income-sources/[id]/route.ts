import { NextResponse } from "next/server"
import { withAuth } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { updateIncomeSourceSchema } from "@growbase/shared/schemas/income-source"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {
    const { id } = await params

    const body = await request.json().catch(() => null)
    const parsed = updateIncomeSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    try {
      // SCD Type 2: close old record, create new one
      const today = new Date().toISOString().split("T")[0]

      // Fetch old record
      const { data: old, error: fetchErr } = await supabaseAdmin
        .from("income_sources")
        .select("source_name, member_id")
        .eq("id", id)
        .eq("household_id", auth.householdId)
        .single()

      if (fetchErr || !old) {
        return NextResponse.json(
          { data: null, error: "Nguồn thu không tồn tại" },
          { status: 404 }
        )
      }

      // Validate member_id BEFORE closing old record — a stale/foreign id would otherwise
      // fail the insert FK after the old record is already closed, destroying the source
      if (parsed.data.member_id) {
        const { data: member } = await supabaseAdmin
          .from("household_members")
          .select("id")
          .eq("id", parsed.data.member_id)
          .eq("household_id", auth.householdId)
          .eq("is_active", true)
          .maybeSingle()

        if (!member) {
          return NextResponse.json(
            { data: null, error: "Thành viên không hợp lệ" },
            { status: 400 }
          )
        }
      }

      // Step 1: Close old record
      const { error: closeErr } = await supabaseAdmin
        .from("income_sources")
        .update({ is_current: false, effective_to: today })
        .eq("id", id)
        .eq("household_id", auth.householdId)

      if (closeErr) {
        return NextResponse.json({ data: null, error: closeErr.message }, { status: 500 })
      }

      // Step 2: Create new current record
      const { data: newRecord, error: insertErr } = await supabaseAdmin
        .from("income_sources")
        .insert({
          household_id: auth.householdId,
          source_name: old.source_name,
          monthly_amount: parsed.data.monthly_amount,
          member_id:
            parsed.data.member_id !== undefined ? parsed.data.member_id : old.member_id,
          is_current: true,
          effective_from: today,
        })
        .select()
        .single()

      if (insertErr) {
        return NextResponse.json({ data: null, error: insertErr.message }, { status: 500 })
      }

      return NextResponse.json({ data: newRecord, error: null })
    } catch {
      return NextResponse.json(
        { data: null, error: "Lỗi cập nhật nguồn thu" },
        { status: 500 }
      )
    }
  })
}
