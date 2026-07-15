"use client"

import { Icon } from "@iconify/react"
import { HouseholdSettingsForm } from "@/components/settings/HouseholdSettingsForm"
import { MembersManager } from "@/components/settings/MembersManager"
import { InviteMemberForm } from "@/components/settings/InviteMemberForm"
import { useMembers } from "@/lib/hooks/useMembers"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { PageHeader } from "@/components/shared/PageHeader"

export default function HouseholdSettingsPage() {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const { data } = useMembers()
  const user = useAppStore((s) => s.user)
  const members = data?.members ?? []
  const currentMember = members.find((m) => m.user_id === user?.id)
  const isOwner = currentMember?.role === "owner"

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        titleKey="settings.household"
        breadcrumbs={[{ labelKey: "nav.settings", href: "/settings" }]}
      />
      <div className="space-y-4">
        <HouseholdSettingsForm />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Icon icon="lucide:users" className="h-4 w-4 text-muted-foreground" />
            {t("settings.members")}
          </h2>
          {isOwner && <InviteMemberForm />}
        </div>
        <MembersManager />
      </div>
    </div>
  )
}
