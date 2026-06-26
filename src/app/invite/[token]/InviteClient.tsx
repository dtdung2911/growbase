"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@iconify/react"
import { toast } from "sonner"
import { BrandLogo } from "@/components/brand/BrandLogo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAcceptInvite } from "@/lib/hooks/useInvitation"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n/useTranslation"

interface InviteClientProps {
  token: string
  isAuthenticated: boolean
  isExpired: boolean
  invitation: { householdName: string; displayName: string } | null
}

export function InviteClient({
  token,
  isAuthenticated,
  isExpired,
  invitation,
}: InviteClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const accept = useAcceptInvite()
  const [signingIn, setSigningIn] = useState(false)

  if (!invitation) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">{t("invite.notFound")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("invite.notFoundDesc")}
        </p>
      </Shell>
    )
  }

  if (isExpired) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">{t("invite.expired")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("invite.expiredDesc", { name: invitation.householdName })}
        </p>
      </Shell>
    )
  }

  const handleAccept = async () => {
    if (!isAuthenticated) {
      setSigningIn(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/invite/${token}`,
        },
      })
      if (error) {
        setSigningIn(false)
        toast.error(t("login.failed"), { duration: 5000 })
      }
      return
    }

    const result = await accept.mutateAsync(token)
    toast.success(
      result.alreadyMember ? t("invite.alreadyMember") : t("invite.joined"),
      { duration: 2000 }
    )
    router.push("/dashboard")
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold">{t("invite.title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("invite.description", {
          household: invitation.householdName,
          displayName: invitation.displayName,
        })}
      </p>
      <Button
        type="button"
        onClick={handleAccept}
        disabled={accept.isPending || signingIn}
        className="w-full"
        size="lg"
      >
        {(accept.isPending || signingIn) && (
          <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
        )}
        {isAuthenticated ? t("invite.accept") : t("invite.signInToJoin")}
      </Button>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
          <BrandLogo variant="mark" imageClassName="h-14 w-14" />
          {children}
        </CardContent>
      </Card>
    </main>
  )
}
