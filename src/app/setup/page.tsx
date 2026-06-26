import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SetupClient } from "./SetupClient"
import type { Household } from "@/types/app"

export default async function SetupPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data } = await supabase
    .from("households")
    .select(
      "id, name, household_type, currency, onboarding_completed, household_members!inner(user_id)"
    )
    .eq("household_members.user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (data?.onboarding_completed === true) {
    redirect("/dashboard")
  }

  const initialHousehold: Household | null = data
    ? {
        id: data.id,
        name: data.name,
        household_type: data.household_type,
        currency: data.currency,
        onboarding_completed: data.onboarding_completed,
      }
    : null

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Gia đình của tôi"

  return (
    <SetupClient initialHousehold={initialHousehold} defaultName={defaultName} />
  )
}
