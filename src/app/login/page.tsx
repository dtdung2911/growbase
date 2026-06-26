import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LoginClient } from "./LoginClient"

export const metadata = {
  title: "Đăng nhập — GrowBase",
  description: "Đăng nhập vào GrowBase để quản lý tài chính gia đình",
}

export default async function LoginPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return <LoginClient />
}
