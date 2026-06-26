"use client"

import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { cn } from "@/lib/utils/cn"

type TransactionReminderProps = {
  onAdd: () => void
  onDismiss: () => void
  className?: string
}

export function TransactionReminder({
  onAdd,
  onDismiss,
  className,
}: TransactionReminderProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "animate-page-in flex items-start gap-3 rounded-[15px] border border-warning/40 bg-warning-soft/40 p-4",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
        <Icon icon="lucide:bell-ring" className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {t("notification.txReminder")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("notification.txReminderDesc")}
        </p>
        <div className="mt-3">
          <Button size="sm" className="min-h-[44px]" onClick={onAdd}>
            <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
            {t("notification.addNow")}
          </Button>
        </div>
      </div>

      <button
        type="button"
        aria-label={t("notification.dismiss")}
        onClick={onDismiss}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-warning/15 hover:text-warning"
      >
        <Icon icon="lucide:x" className="h-4 w-4" />
      </button>
    </div>
  )
}
