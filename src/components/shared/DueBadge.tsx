"use client"

import { cn } from "@/lib/utils/cn"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { UrgencyLevel } from "@/types/app"

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

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        urgencyLevel === "overdue" && "bg-rose-500/10 text-rose-500",
        urgencyLevel === "due-soon" && "bg-rose-500/10 text-rose-500",
        urgencyLevel === "upcoming" && "bg-amber-500/10 text-amber-500"
      )}
    >
      {label}
    </span>
  )
}
