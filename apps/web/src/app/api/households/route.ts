import { NextResponse } from "next/server"
import { withAuthUser } from "@/lib/supabase/auth-check"
import { withIdempotency } from "@/lib/api/idempotency"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { z } from "zod"

const createHouseholdSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(60, "Tên tối đa 60 ký tự"),
})

export async function GET() {
  const auth = await withAuthUser()
  if (auth.error) return auth.error
  const { user } = auth

  const supabase = createClient()
  const { data: members, error: membersErr } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })

  if (membersErr) {
    return NextResponse.json({ data: null, error: membersErr.message }, { status: 500 })
  }

  if (!members || members.length === 0) {
    return NextResponse.json({ data: [], error: null })
  }

  const householdIds = members.map((m) => m.household_id)
  const { data: householdsData, error: householdsErr } = await supabase
    .from("households")
    .select("*")
    .in("id", householdIds)

  if (householdsErr) {
    return NextResponse.json({ data: null, error: householdsErr.message }, { status: 500 })
  }

  const nameById = Object.fromEntries((householdsData ?? []).map((h) => [h.id, h.name]))
  const households = members.map((m) => ({
    id: m.household_id,
    name: nameById[m.household_id] ?? "",
    role: m.role as "owner" | "member",
  }))

  return NextResponse.json({ data: households, error: null })
}

export async function POST(req: Request) {
  const auth = await withAuthUser()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, req, async () => {
    const { user } = auth

    const body = await req.json()
    const parsed = createHouseholdSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const { name } = parsed.data

    const { data: household, error: householdErr } = await supabaseAdmin
      .from("households")
      .insert({
        name,
        currency: "VND",
      })
      .select("id, name")
      .single()

    if (householdErr || !household) {
      return NextResponse.json(
        { data: null, error: householdErr?.message ?? "Không tạo được hộ gia đình" },
        { status: 500 }
      )
    }

    const { error: memberErr } = await supabaseAdmin.from("household_members").insert({
      household_id: household.id,
      user_id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? "Owner",
      role: "owner",
      is_active: true,
    })

    if (memberErr) {
      return NextResponse.json({ data: null, error: memberErr.message }, { status: 500 })
    }

    return NextResponse.json({ data: household, error: null }, { status: 201 })
  })
}
