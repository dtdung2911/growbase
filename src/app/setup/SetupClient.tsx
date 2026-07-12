"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Icon } from "@iconify/react"
import { OnboardingV2Shell } from "@/components/onboarding/v2/OnboardingV2Shell"
import { HookStep } from "@/components/onboarding/v2/HookStep"
import { GoalStep } from "@/components/onboarding/v2/GoalStep"
import { IncomeStep } from "@/components/onboarding/v2/IncomeStep"
import { TadaStep } from "@/components/onboarding/v2/TadaStep"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { keys } from "@/lib/queries/queryKeys"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"

type PendingInvite = { token: string; householdName: string; role: string }

// Onboarding v2 — 4 bước "mở quà": Hook → Thu nhập → Mục tiêu → Tada (PRD onboarding-v2 F1).
// Thu nhập trước Mục tiêu: engine gợi ý khả thi cần thu nhập tại lúc nhập số đích (story 10.2 D1).
export function SetupClient() {
  const step = useOnboardingV2Store((s) => s.step)

  // Chờ zustand persist hydrate từ sessionStorage — tránh nháy về step 0 khi reload
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Người được mời (0-household) bị middleware đẩy về /setup → phải cho tham gia thay vì ép tạo mới.
  const invitesQuery = useQuery({
    queryKey: keys.pendingInvitations(),
    queryFn: async () => {
      const res = await fetch("/api/invitations/pending")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Lỗi tải lời mời")
      return json.data as PendingInvite[]
    },
  })

  const [createNew, setCreateNew] = useState(false)

  if (!hydrated || invitesQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const invites = invitesQuery.data ?? []
  if (invites.length > 0 && !createNew) {
    return <InvitedScreen invites={invites} onCreateNew={() => setCreateNew(true)} />
  }

  return (
    <OnboardingV2Shell>
      {step === 0 && <HookStep />}
      {step === 1 && <IncomeStep />}
      {step === 2 && <GoalStep />}
      {step === 3 && <TadaStep />}
    </OnboardingV2Shell>
  )
}

function InvitedScreen({
  invites,
  onCreateNew,
}: {
  invites: PendingInvite[]
  onCreateNew: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
            <Icon icon="lucide:mail-open" className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-ink">{t("setup.invited.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("setup.invited.subtitle")}</p>
        </div>

        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.token}
              className="flex items-center justify-between gap-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{invite.householdName}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`settings.members.role.${invite.role}`)}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => router.push(`/invite/${invite.token}`)}
                className="min-h-[44px] shrink-0"
              >
                {t("setup.invited.join")}
              </Button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="w-full py-2 text-center text-sm font-medium text-primary hover:underline"
        >
          {t("setup.invited.createNew")}
        </button>
      </div>
    </div>
  )
}
