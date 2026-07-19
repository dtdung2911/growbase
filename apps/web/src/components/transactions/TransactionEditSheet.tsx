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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFunds, useChangeFundSource } from "@/lib/hooks/useFunds"
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

  // 19-7: đổi nguồn tiền hậu kiểm — chỉ expense, đường được phép duy nhất trên tx gắn quỹ
  const { data: funds = [] } = useFunds()
  const changeSource = useChangeFundSource()
  const canChangeSource = transaction.transaction_type === "expense"

  const handleChangeSource = (value: string) => {
    const fundId = value === "income" ? null : value
    if (fundId === (transaction.fund_id ?? null)) return
    changeSource.mutate(
      {
        transaction_id: transaction.id,
        fund_id: fundId,
        previous_fund_id: transaction.fund_id ?? null,
        transaction_date: transaction.transaction_date,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

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
          {canChangeSource && (
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium">{t("tx.fundSource")}</p>
              <Select
                value={transaction.fund_id ?? "income"}
                onValueChange={handleChangeSource}
                disabled={changeSource.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{t("tx.sourceMonthlyIncome")}</SelectItem>
                  {funds.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} —{" "}
                      <span className="font-mono tabular-nums">
                        {formatVND(f.current_balance)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
