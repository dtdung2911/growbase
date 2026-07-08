"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { useMembers } from "@/lib/hooks/useMembers"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { shouldShowInvitePrompt } from "@/lib/insight/invitePrompt"

type InviteCompanionPromptProps = {
  activeDaysLast7: number
}

export function InviteCompanionPrompt({ activeDaysLast7 }: InviteCompanionPromptProps) {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const { data, isLoading } = useMembers()

  // Key theo householdId (AD-3). undefined = chưa đọc localStorage → chưa render (tránh SSR mismatch)
  const storageKey = `growbase.invite-moment-dismissed.${householdId}`
  const [dismissedAt, setDismissedAt] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    if (!householdId) return
    const raw = localStorage.getItem(storageKey)
    setDismissedAt(raw ? Number(raw) : null)
  }, [householdId, storageKey])

  if (dismissedAt === undefined || isLoading || !data) return null
  if (!shouldShowInvitePrompt(data.members.length, activeDaysLast7, dismissedAt, Date.now())) {
    return null
  }

  function dismiss() {
    const now = Date.now()
    try {
      localStorage.setItem(storageKey, String(now))
    } catch {
      // private mode — ẩn trong session này là đủ
    }
    setDismissedAt(now)
  }

  return (
    <div className="rounded-[13px] border border-border/40 bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <Icon icon="lucide:user-plus" className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-ink">{t("dashboard.inviteMoment.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.inviteMoment.body")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/settings/members"
              className="flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-[0.8]"
            >
              {t("dashboard.inviteMoment.cta")}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t("dashboard.inviteMoment.dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
