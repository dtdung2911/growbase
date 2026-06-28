"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useFundRelease } from "@/lib/hooks/useFunds"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import type { Fund } from "@/types/app"

type MonthlyBufferBannerProps = {
  fund: Fund
}

function shouldShowBanner(fund: Fund, currentMonth: string): boolean {
  if (fund.fund_type !== "freedom" || !fund.reset_monthly) return false
  if (fund.current_balance <= 0) return false

  const today = new Date()
  const dayOfMonth = today.getDate()
  if (dayOfMonth > 10) return false

  // D6: check released_at != current month
  if (fund.released_at) {
    const releasedMonth = fund.released_at.slice(0, 7)
    if (releasedMonth === currentMonth) return false
  }

  return true
}

export function MonthlyBufferBanner({ fund }: MonthlyBufferBannerProps) {
  const { t } = useTranslation()
  const currentMonth = useAppStore((s) => s.currentMonth)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const release = useFundRelease(fund.id)

  if (!shouldShowBanner(fund, currentMonth)) return null

  return (
    <>
      <div className="flex items-start gap-3 rounded-[13px] border border-warning/20 bg-warning-soft p-4 shadow-card">
        <Icon icon="lucide:alert-circle" className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-warning">
            {t("funds.bufferNotReleased")}
          </p>
          <p className="text-xs text-warning/90">
            {t("funds.bufferBalance", { amount: formatVND(fund.current_balance) })}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="border-warning/40 text-warning hover:bg-warning-soft"
            onClick={() => setConfirmOpen(true)}
          >
            {t("funds.releaseBuffer")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("funds.releaseConfirmTitle")}
        description={t("funds.releaseConfirmDesc", {
          name: fund.name,
          amount: formatVND(fund.current_balance),
        })}
        confirmLabel={t("funds.releaseBuffer")}
        onConfirm={() =>
          release.mutate(undefined, {
            onSuccess: () => setConfirmOpen(false),
          })
        }
        isPending={release.isPending}
      />
    </>
  )
}
