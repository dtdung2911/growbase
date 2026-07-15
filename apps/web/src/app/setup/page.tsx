import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SetupClient } from "./SetupClient"

export default async function SetupPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <SetupClient />
}
