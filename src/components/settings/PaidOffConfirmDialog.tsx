"use client"

import { useState } from "react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { CelebrationNotification } from "@/components/settings/CelebrationNotification"
import { usePaidOffDebt } from "@/lib/hooks/useDebtMutations"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { DebtEntry } from "@/types/app"

type PaidOffConfirmDialogProps = {
  debt: DebtEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaidOffConfirmDialog({
  debt,
  open,
  onOpenChange,
}: PaidOffConfirmDialogProps) {
  const { t } = useTranslation()
  const paidOffMutation = usePaidOffDebt()
  const [showCelebration, setShowCelebration] = useState(false)

  const handleConfirm = () => {
    if (!debt) return
    paidOffMutation.mutate(debt.id, {
      onSuccess: (result) => {
        onOpenChange(false)
        if (result.is_last_debt) {
          setShowCelebration(true)
        }
      },
    })
  }

  return (
    <>
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("settings.debt.paidOffConfirmTitle")}
        description={t("settings.debt.paidOffConfirmDesc", { name: debt?.creditor_name ?? "" })}
        confirmLabel={t("settings.debt.paidOffLabel")}
        onConfirm={handleConfirm}
        isPending={paidOffMutation.isPending}
      />
      <CelebrationNotification show={showCelebration} />
    </>
  )
}
