"use client"

import { Icon } from "@iconify/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Member } from "@growbase/shared/types/app"
import type { VariantProps } from "class-variance-authority"
import type { badgeVariants } from "@/components/ui/badge"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const ROLE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  owner: "violet",
  member: "default",
  viewer: "secondary",
}

type MemberCardProps = {
  member: Member
  isOwner: boolean
  onDelete: () => void
}

export function MemberCard({ member, isOwner, onDelete }: MemberCardProps) {
  const { t, locale } = useTranslation()
  const roleVariant = ROLE_BADGE_VARIANT[member.role] ?? "secondary"
  const canDelete = isOwner && member.role !== "owner"
  const joinedDate = new Date(member.joined_at).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US"
  )

  return (
    <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{member.display_name}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={roleVariant} className="text-[10px] font-normal">
              {t(`settings.members.role.${member.role}`)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("settings.members.joinedAt", { date: joinedDate })}
          </p>
        </div>

        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Icon icon="lucide:trash-2" className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
