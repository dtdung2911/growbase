"use client"

import { MembersManager } from "@/components/settings/MembersManager"
import { InviteMemberForm } from "@/components/settings/InviteMemberForm"
import { PageHeader } from "@/components/shared/PageHeader"
import { useMembers } from "@/lib/hooks/useMembers"
import { useAppStore } from "@/lib/stores/appStore"

export default function MembersSettingsPage() {
  const { data } = useMembers()
  const user = useAppStore((s) => s.user)
  const members = data?.members ?? []
  const isOwner = members.find((m) => m.user_id === user?.id)?.role === "owner"

  return (
    <div className="space-y-4 pb-16">
      <PageHeader
        titleKey="settings.members"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      {isOwner && (
        <div className="flex justify-end">
          <InviteMemberForm />
        </div>
      )}
      <MembersManager />
    </div>
  )
}
