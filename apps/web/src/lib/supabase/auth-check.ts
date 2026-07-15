import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function withAuthUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase: null,
      user: null,
      error: NextResponse.json(
        { data: null, error: "Chưa đăng nhập" },
        { status: 401 }
      ),
    } as const
  }

  return { supabase, user, error: null } as const
}

export async function withAuth() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase: null,
      user: null,
      error: NextResponse.json(
        { data: null, error: "Chưa đăng nhập" },
        { status: 401 }
      ),
    } as const
  }

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id, id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  if (!member) {
    return {
      supabase: null,
      user: null,
      error: NextResponse.json(
        { data: null, error: "Không thuộc hộ gia đình nào" },
        { status: 403 }
      ),
    } as const
  }

  return {
    supabase,
    user,
    householdId: member.household_id,
    memberId: member.id,
    error: null,
  } as const
}

export async function verifyHouseholdMember(
  supabase: SupabaseClient,
  userId: string,
  householdId: string
): Promise<{ ok: true } | { ok: false; error: NextResponse }> {
  const { data } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", userId)
    .eq("household_id", householdId)
    .eq("is_active", true)
    .maybeSingle()

  if (!data) {
    return {
      ok: false,
      error: NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 }),
    }
  }
  return { ok: true }
}
