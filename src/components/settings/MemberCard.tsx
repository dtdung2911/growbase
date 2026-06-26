"use client"

import { cn } from "@/lib/utils/cn"
import { Icon } from "@iconify/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Member } from "@/types/app"

const ROLE_BADGE_CLASS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  member: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
}

type MemberCardProps = {
  member: Member
  isOwner: boolean
  onDelete: () => void
}

export function MemberCard({ member, isOwner, onDelete }: MemberCardProps) {
  const { t, locale } = useTranslation()
  const roleClass = ROLE_BADGE_CLASS[member.role]
  const canDelete = isOwner && member.role !== "owner"
  const joinedDate = new Date(member.joined_at).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US"
  )

  return (
    <div className="rounded-[15px] border border-border bg-card p-4 shadow-panel">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{member.display_name}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className={cn("text-[10px] font-normal", roleClass)}
            >
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
