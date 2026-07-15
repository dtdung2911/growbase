"use client"

import { Icon } from "@iconify/react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Invitation } from "@growbase/shared/types/app"
import type { VariantProps } from "class-variance-authority"
import type { badgeVariants } from "@/components/ui/badge"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const ROLE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  owner: "violet",
  member: "default",
  viewer: "secondary",
}

type InviteCardProps = {
  invitation: Invitation
}

export function InviteCard({ invitation }: InviteCardProps) {
  const { t, locale } = useTranslation()
  const roleVariant = ROLE_BADGE_VARIANT[invitation.role] ?? "secondary"
  const expiresDate = new Date(invitation.expires_at).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US"
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${invitation.token}`)
      toast.success(t("settings.members.linkCopied"), { duration: 2000 })
    } catch {
      toast.error(t("settings.members.copyFailed"), { duration: 5000 })
    }
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-[13px] border border-dashed border-border/40 bg-card p-4 shadow-card">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">{invitation.display_name}</h4>
        <p className="text-xs text-muted-foreground">{invitation.email}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={roleVariant} className="text-[10px] font-normal">
            {t(`settings.members.role.${invitation.role}`)}
          </Badge>
          <Badge variant="warning" className="text-[10px] font-normal">
            {t("settings.members.pendingBadge")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.members.expiresAt", { date: expiresDate })}
        </p>
      </div>
      {invitation.status === "pending" && invitation.token && (
        <button
          type="button"
          onClick={copyLink}
          aria-label={t("common.copy")}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Icon icon="lucide:copy" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
