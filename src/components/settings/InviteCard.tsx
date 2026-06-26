"use client"

import { cn } from "@/lib/utils/cn"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Invitation } from "@/types/app"

const ROLE_BADGE_CLASS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  member: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
}

type InviteCardProps = {
  invitation: Invitation
}

export function InviteCard({ invitation }: InviteCardProps) {
  const { t, locale } = useTranslation()
  const roleClass = ROLE_BADGE_CLASS[invitation.role]
  const expiresDate = new Date(invitation.expires_at).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US"
  )

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-4 shadow-panel">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">{invitation.display_name}</h4>
        <p className="text-xs text-muted-foreground">{invitation.email}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className={cn("text-[10px] font-normal", roleClass)}
          >
            {t(`settings.members.role.${invitation.role}`)}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-[10px] font-normal text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
          >
            {t("settings.members.pendingBadge")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.members.expiresAt", { date: expiresDate })}
        </p>
      </div>
    </div>
  )
}
