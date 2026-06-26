import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { householdSchema } from "@/lib/validations/household"
import { updateHouseholdSchema } from "@/lib/validations/household-settings"

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from("households")
    .select(
      "id, name, household_type, currency, onboarding_completed, household_members!inner(user_id, role)"
    )
    .eq("household_members.user_id", user.id)
    .eq("household_members.role", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: null })
  }

  const { household_members: _members, ...household } = data
  return NextResponse.json({ data: household, error: null })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = householdSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }
  const { name, type, currency } = parsed.data

  // BR-OB-004: user đã có household → UPDATE, không tạo mới.
  const { data: existing } = await supabaseAdmin
    .from("households")
    .select("id, household_members!inner(user_id, role)")
    .eq("household_members.user_id", user.id)
    .eq("household_members.role", "owner")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("households")
      .update({ name, household_type: type, currency })
      .eq("id", existing.id)
      .select("id, name, household_type, currency, onboarding_completed")
      .single()

    if (updErr) {
      return NextResponse.json({ data: null, error: updErr.message }, { status: 500 })
    }
    return NextResponse.json({ data: updated, error: null })
  }

  const { data: created, error: insErr } = await supabaseAdmin
    .from("households")
    .insert({ name, household_type: type, currency })
    .select("id, name, household_type, currency, onboarding_completed")
    .single()

  if (insErr || !created) {
    return NextResponse.json(
      { data: null, error: insErr?.message ?? "Không tạo được hộ gia đình" },
      { status: 500 }
    )
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Chủ hộ"

  const { error: memberErr } = await supabaseAdmin.from("household_members").insert({
    household_id: created.id,
    user_id: user.id,
    display_name: displayName,
    role: "owner",
  })

  if (memberErr) {
    return NextResponse.json({ data: null, error: memberErr.message }, { status: 500 })
  }

  return NextResponse.json({ data: created, error: null })
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Chưa đăng nhập" }, { status: 401 })
  }

  // Guard: check caller is owner
  const { data: member } = await supabaseAdmin
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle()

  if (!member) {
    return NextResponse.json(
      { data: null, error: "Chỉ chủ hộ mới có thể cập nhật" },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = updateHouseholdSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from("households")
    .update(parsed.data)
    .eq("id", member.household_id)
    .select("id, name, household_type, currency, onboarding_completed")
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
