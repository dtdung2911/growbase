import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createClient, createBearerClient } from "@/lib/supabase/server"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { Database } from "@growbase/shared/types/database"

// Đọc `Authorization: Bearer <token>` (mobile, không cookie). Nếu có token → trả về client mang
// Authorization header đó cho MỌI query sau (RLS resolve đúng user); nếu không → cookie client cũ.
// QUAN TRỌNG: client trả về khi có Bearer phải LÀ createBearerClient(token), không chỉ dùng token
// để verify identity rồi trả về cookie client (bug review trước: household lookup + query trong route
// dùng lại supabase này, cookie client không có cookie cho mobile → RLS chặn hết dù getUser đã pass).
async function resolveAuthContext(): Promise<{
  supabase: SupabaseClient<Database>
  user: User | null
}> {
  const authorization = headers().get("authorization")
  const match = authorization?.match(/^Bearer\s+(.+)$/i)

  if (match) {
    const token = match[1]
    const supabase = createBearerClient(token)
    const {
      data: { user },
    } = await supabase.auth.getUser(token)
    return { supabase, user }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function withAuthUser() {
  const { supabase, user } = await resolveAuthContext()

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
  const { supabase, user } = await resolveAuthContext()

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
