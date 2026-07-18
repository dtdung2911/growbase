"use client"

import { useState } from "react"
import Link from "next/link"
import { Icon } from "@iconify/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import {
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/lib/hooks/useTransactions"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import type { TransactionWithJoins } from "@growbase/shared/types/app"
import type { CreateTransactionInput } from "@growbase/shared/schemas/transaction"

type TransactionEditSheetProps = {
  transaction: TransactionWithJoins | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionEditSheet({
  transaction,
  open,
  onOpenChange,
}: TransactionEditSheetProps) {
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  if (!transaction) return null

  // R3: system-generated transactions are read-only
  const SYSTEM_TYPES = ["internal_transfer", "fund_contribution", "fund_withdrawal"]
  const isSystemTx = SYSTEM_TYPES.includes(transaction.transaction_type)
  // 19-3: giao dịch gắn quỹ cũng khóa — sửa/xóa làm lệch số dư quỹ
  const isLocked = isSystemTx || Boolean(transaction.fund_id)

  const handleSubmit = (data: CreateTransactionInput) => {
    updateMutation.mutate(
      { ...data, id: transaction.id },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(transaction.id, {
      onSuccess: () => {
        setConfirmDelete(false)
        onOpenChange(false)
      },
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>
                {isLocked ? t("tx.transactionDetail") : t("tx.editTransaction")}
              </SheetTitle>
              {!isLocked && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Icon icon="lucide:trash-2" className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="mt-4">
            {isLocked ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {transaction.fund_id ? t("tx.fundTxLocked") : t("tx.systemTxReadonly")}
                </p>
                {transaction.fund_id && (
                  <Link
                    href={`/funds/${transaction.fund_id}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {t("tx.viewFund")} →
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">{t("tx.type")}</span>
                  <span>{transaction.transaction_type}</span>
                  <span className="text-muted-foreground">{t("tx.amount")}</span>
                  <span className="font-mono tabular-nums">{formatVND(transaction.amount)}</span>
                  <span className="text-muted-foreground">{t("tx.date")}</span>
                  <span>{transaction.transaction_date}</span>
                  {transaction.description && (
                    <>
                      <span className="text-muted-foreground">{t("tx.description")}</span>
                      <span>{transaction.description}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <TransactionForm
                defaultDirection={transaction.direction}
                initialData={transaction}
                onSubmit={handleSubmit}
                isPending={updateMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("tx.deleteTransaction")}
        description={t("tx.deleteConfirm")}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
