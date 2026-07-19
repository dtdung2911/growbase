"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useLeaveHousehold } from "@/lib/hooks/useMembers"
import { useTranslation } from "@/lib/i18n/useTranslation"

export function LeaveHouseholdButton() {
  const { t } = useTranslation()
  const leaveMutation = useLeaveHousehold()
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <Button
        variant="destructive"
        className="w-full rounded-xl"
        onClick={() => setShowConfirm(true)}
      >
        {t("settings.members.leaveButton")}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={t("settings.members.leaveTitle")}
        description={t("settings.members.leaveDesc")}
        confirmLabel={t("settings.members.leaveLabel")}
        onConfirm={() => {
          leaveMutation.mutate(undefined, {
            onSuccess: () => setShowConfirm(false),
          })
        }}
        isPending={leaveMutation.isPending}
      />
    </>
  )
}
