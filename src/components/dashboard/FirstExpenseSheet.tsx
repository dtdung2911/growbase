"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useAppStore } from "@/lib/stores/appStore"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useCategories } from "@/lib/hooks/useCategories"
import { useCreateTransaction } from "@/lib/hooks/useTransactions"
import { keys } from "@/lib/queries/queryKeys"
import { resolveDefaultCategory } from "@/lib/insight/resolveDefaultCategory"

type FirstExpenseSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FirstExpenseSheet({ open, onOpenChange }: FirstExpenseSheetProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId) ?? ""
  const month = useAppStore((s) => s.currentMonth)
  const { data: accounts = [] } = useAccounts()
  const { data: categoryGroups = [] } = useCategories(householdId)
  const createTx = useCreateTransaction()
  const [amount, setAmount] = useState(0)
  const [showPromise, setShowPromise] = useState(false)

  const accountId = accounts[0]?.id
  const category = resolveDefaultCategory(categoryGroups)
  const canSave = Boolean(accountId && category?.id) && amount > 0

  function handleSave() {
    if (!accountId || !category) return

    createTx.mutate(
      {
        amount,
        direction: "out",
        transaction_type: "expense",
        category_id: category.id,
        account_id: accountId,
        transaction_date: new Date().toISOString().slice(0, 10),
        is_unusual_income: false,
      },
      {
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
          setAmount(0)
          onOpenChange(false)
          setShowPromise(true)
        },
      }
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("dashboard.firstExpenseCta.title")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <CurrencyInput value={amount} onChange={setAmount} placeholder="0" autoFocus />
            {category && (
              <Badge variant="secondary" className="gap-1.5">
                {category.icon} {category.name}
              </Badge>
            )}
            <Button className="w-full" disabled={!canSave || createTx.isPending} onClick={handleSave}>
              {createTx.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showPromise} onOpenChange={setShowPromise}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.firstExpenseCta.saved")}</DialogTitle>
            <DialogDescription>{t("dashboard.firstExpenseCta.promise")}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
