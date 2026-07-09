"use client"

import { useState } from "react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { DueBadge } from "@/components/shared/DueBadge"
import { MarkPaidDialog } from "@/components/scheduled-payments/MarkPaidDialog"
import { Button } from "@/components/ui/button"
import type { ScheduledPayment } from "@/types/app"

type PaymentCardProps = {
  payment: ScheduledPayment
}

const PERIOD_KEYS: Record<string, string> = {
  monthly: "scheduledPayments.monthly",
  quarterly: "scheduledPayments.quarterly",
  yearly: "scheduledPayments.yearly",
}

export function PaymentCard({ payment }: PaymentCardProps) {
  const { t } = useTranslation()
  const [markPaidOpen, setMarkPaidOpen] = useState(false)

  return (
    <>
      <div className={cn("space-y-2 rounded-[13px] border border-border/40 bg-card p-4 shadow-card")}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">{payment.name}</p>
            <p className="text-xs text-muted-foreground">
              {t(PERIOD_KEYS[payment.period] ?? "scheduledPayments.monthly")}
              {payment.payment_method && ` - ${payment.payment_method}`}
            </p>
          </div>
          <p className="text-base font-medium font-mono tabular-nums text-expense">
            {formatVND(payment.amount)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("scheduledPayments.nextDue")}: {payment.next_due_date}
            </span>
            <DueBadge
              urgencyLevel={payment.urgency_level}
              daysUntilDue={payment.days_until_due}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMarkPaidOpen(true)}
            className="min-h-[44px]"
          >
            {t("scheduledPayments.markPaid")}
          </Button>
        </div>

        {payment.notes && (
          <p className="text-xs text-muted-foreground">{payment.notes}</p>
        )}
      </div>

      <MarkPaidDialog
        payment={payment}
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
      />
    </>
  )
}
