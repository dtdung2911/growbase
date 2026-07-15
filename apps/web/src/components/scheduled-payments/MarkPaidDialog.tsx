"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { useMarkPaymentPaid } from "@/lib/hooks/useScheduledPayments"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useCategories } from "@/lib/hooks/useCategories"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { ScheduledPayment } from "@growbase/shared/types/app"

type MarkPaidDialogProps = {
  payment: ScheduledPayment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MarkPaidDialog({ payment, open, onOpenChange }: MarkPaidDialogProps) {
  const { t } = useTranslation()
  const markPaid = useMarkPaymentPaid()
  const { data: accounts, isLoading: accountsLoading } = useAccounts()
  const householdId = useAppStore((s) => s.householdId)
  const { data: categoryGroups, isLoading: categoriesLoading } = useCategories(householdId ?? "")
  const [createTx, setCreateTx] = useState(true)
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")

  const handleConfirm = () => {
    markPaid.mutate(
      {
        paymentId: payment.id,
        create_transaction: createTx,
        account_id: createTx ? accountId || null : null,
        category_id: createTx ? categoryId || null : null,
        date: new Date().toISOString().slice(0, 10),
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("scheduledPayments.markPaid")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm">
            {payment.name} - <span className="font-mono tabular-nums">{formatVND(payment.amount)}</span>
          </p>

          <div className="flex items-center gap-3">
            <Switch
              id="create-tx"
              checked={createTx}
              onCheckedChange={setCreateTx}
            />
            <Label htmlFor="create-tx" className="text-sm">
              {t("scheduledPayments.createTx")}
            </Label>
          </div>

          {createTx && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-secondary mb-1.5 block">
                  {t("scheduledPayments.account")}
                </label>
                {accountsLoading ? (
                  <Skeleton className="h-[44px] w-full rounded-xl" />
                ) : (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-xl border bg-inset px-3 min-h-[44px] text-base"
                  >
                    <option value="">{t("scheduledPayments.selectAccount")}</option>
                    {(accounts ?? []).map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-secondary mb-1.5 block">
                  {t("scheduledPayments.category")}
                </label>
                {categoriesLoading ? (
                  <Skeleton className="h-[44px] w-full rounded-xl" />
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border bg-inset px-3 min-h-[44px] text-base"
                  >
                    <option value="">{t("scheduledPayments.selectCategory")}</option>
                    {(categoryGroups ?? []).flatMap((g) =>
                      g.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {g.name} / {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px]">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={markPaid.isPending || (createTx && (!accountId || !categoryId))}
            className="min-h-[44px]"
          >
            {markPaid.isPending ? (
              <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
            ) : (
              t("common.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
