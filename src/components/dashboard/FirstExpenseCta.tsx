"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { FirstExpenseSheet } from "@/components/dashboard/FirstExpenseSheet"

export function FirstExpenseCta() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-[18px] border border-primary/30 bg-primary-soft p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon icon="lucide:coffee" className="h-5 w-5" />
        </div>
        <p className="flex-1 text-sm font-semibold">{t("dashboard.firstExpenseCta.title")}</p>
      </div>
      <Button className="mt-4 w-full" onClick={() => setOpen(true)}>
        {t("dashboard.firstExpenseCta.cta")}
      </Button>
      <FirstExpenseSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}
