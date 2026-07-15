"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { Separator } from "@/components/ui/separator"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { MemberCard } from "@/components/settings/MemberCard"
import { InviteCard } from "@/components/settings/InviteCard"
import { LeaveHouseholdButton } from "@/components/settings/LeaveHouseholdButton"
import { useMembers, useDeleteMember } from "@/lib/hooks/useMembers"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Member } from "@growbase/shared/types/app"

export function MembersManager() {
  const { t } = useTranslation()
  const { data, isLoading } = useMembers()
  const deleteMutation = useDeleteMember()
  const user = useAppStore((s) => s.user)

  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)

  if (isLoading) {
    return <SkeletonList count={3} />
  }

  const members = data?.members ?? []
  const invitations = data?.invitations ?? []

  if (members.length === 0) {
    return (
      <EmptyState
        icon="lucide:users"
        title={t("settings.members.empty")}
        description={t("settings.members.emptyDesc")}
      />
    )
  }

  const currentMember = members.find((m) => m.user_id === user?.id)
  const isOwner = currentMember?.role === "owner"
  const pendingInvitations = invitations.filter((i) => i.status === "pending")

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            {t("settings.members.section", { count: members.length })}
          </h3>
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              isOwner={isOwner}
              onDelete={() => setDeleteTarget(m)}
            />
          ))}
        </div>

        {pendingInvitations.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              {t("settings.members.invitesSection", { count: pendingInvitations.length })}
            </h3>
            {pendingInvitations.map((inv) => (
              <InviteCard key={inv.id} invitation={inv} />
            ))}
          </div>
        )}

        {!isOwner && (
          <div className="pt-4">
            <Separator className="mb-4" />
            <LeaveHouseholdButton />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("settings.members.deleteTitle")}
        description={t("settings.members.deleteDesc", { name: deleteTarget?.display_name ?? "" })}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            })
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
