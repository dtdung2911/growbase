"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { GOOGLE } from "@/lib/design-tokens"

export function LoginButton() {
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setLoading(false)
      toast.error("Đăng nhập thất bại. Thử lại?", { duration: 5000 })
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={signIn}
      disabled={loading}
      className="min-h-14 w-full gap-3 rounded-[7px] border border-border bg-card text-base font-extrabold text-foreground hover:bg-secondary"
    >
      {loading ? (
        <Icon icon="lucide:loader-2" className="h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      Đăng nhập với Google
    </Button>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={GOOGLE.blue}
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill={GOOGLE.green}
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill={GOOGLE.yellow}
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill={GOOGLE.red}
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
