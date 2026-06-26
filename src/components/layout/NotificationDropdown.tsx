"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { QuickAddSheet } from "@/components/transactions/QuickAddSheet"
import { useTransactionReminder } from "@/lib/hooks/useTransactionReminder"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { cn } from "@/lib/utils/cn"

export function NotificationDropdown() {
  const { t } = useTranslation()
  const { showReminder, dismiss } = useTransactionReminder()
  const [open, setOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const handleAdd = () => {
    setOpen(false)
    setQuickAddOpen(true)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("notification.title")}
            className="icon-btn-hover relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-primary-soft hover:text-primary"
          >
            <Icon icon="lucide:bell" className="h-[20px] w-[20px]" />
            {showReminder && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-card" />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold text-ink">
              {t("notification.title")}
            </span>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {showReminder ? (
              <div className="flex items-start gap-3 rounded-[12px] p-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                  <Icon icon="lucide:bell-ring" className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {t("notification.txReminder")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("notification.txReminderDesc")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" className="min-h-[44px]" onClick={handleAdd}>
                      <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
                      {t("notification.addNow")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-[44px]"
                      onClick={dismiss}
                    >
                      {t("notification.dismiss")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center gap-2 px-4 py-8 text-center"
                )}
              >
                <Icon
                  icon="lucide:bell-off"
                  className="h-6 w-6 text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  {t("notification.empty")}
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </>
  )
}
