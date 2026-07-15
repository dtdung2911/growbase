"use client"

import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { UrgencyLevel } from "@growbase/shared/types/app"

type DueBadgeProps = {
  urgencyLevel: UrgencyLevel
  daysUntilDue: number
}

export function DueBadge({ urgencyLevel, daysUntilDue }: DueBadgeProps) {
  const { t } = useTranslation()
  if (urgencyLevel === "normal") return null

  const label =
    urgencyLevel === "overdue"
      ? t("scheduledPayments.overdueDays", { days: Math.abs(daysUntilDue) })
      : urgencyLevel === "due-soon"
        ? daysUntilDue === 0
          ? t("scheduledPayments.today")
          : t("scheduledPayments.daysLeft", { days: daysUntilDue })
        : t("scheduledPayments.daysLeft", { days: daysUntilDue })

  const variant =
    urgencyLevel === "overdue" || urgencyLevel === "due-soon" ? "error" : "warning"

  return <Badge variant={variant}>{label}</Badge>
}
