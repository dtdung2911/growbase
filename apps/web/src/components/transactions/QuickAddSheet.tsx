"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { FundContributeTab } from "@/components/transactions/FundContributeTab"
import { useFundExpense } from "@/lib/hooks/useFunds"
import { InternalTransferForm } from "@/components/transactions/InternalTransferForm"
import { useCreateTransaction } from "@/lib/hooks/useTransactions"
import { useTransfer } from "@/lib/hooks/useTransfer"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { CreateTransactionInput, CreateTransferInput } from "@growbase/shared/schemas/transaction"

type QuickAddSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const { t } = useTranslation()
  const createTx = useCreateTransaction()
  const transfer = useTransfer()
  const fundExpense = useFundExpense()

  const handleExpense = (data: CreateTransactionInput) => {
    createTx.mutate(data, { onSuccess: () => onOpenChange(false) })
  }

  // 19-7: chi từ quỹ — nguồn tiền = quỹ trong form Chi tiêu
  const handleFundExpense = (fundId: string, data: CreateTransactionInput) => {
    fundExpense.mutate(
      {
        fund_id: fundId,
        amount: data.amount,
        category_id: data.category_id,
        account_id: data.account_id,
        description: data.description ?? undefined,
        transaction_date: data.transaction_date,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  const handleIncome = (data: CreateTransactionInput) => {
    createTx.mutate(data, { onSuccess: () => onOpenChange(false) })
  }

  const handleTransfer = (data: CreateTransferInput) => {
    transfer.mutate(data, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("tx.addTransaction")}</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="expense" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="expense" className="flex-1 text-xs">{t("tx.expenseShort")}</TabsTrigger>
            <TabsTrigger value="income" className="flex-1 text-xs">{t("tx.incomeShort")}</TabsTrigger>
            <TabsTrigger value="fund" className="flex-1 text-xs">{t("tx.fundShort")}</TabsTrigger>
            <TabsTrigger value="transfer" className="flex-1 text-xs">{t("tx.transferShort")}</TabsTrigger>
          </TabsList>
          <TabsContent value="expense" className="mt-4">
            <TransactionForm
              defaultDirection="out"
              onSubmit={handleExpense}
              onSubmitFundExpense={handleFundExpense}
              isPending={createTx.isPending || fundExpense.isPending}
              hideDirection
            />
          </TabsContent>
          <TabsContent value="income" className="mt-4">
            <TransactionForm
              defaultDirection="in"
              onSubmit={handleIncome}
              isPending={createTx.isPending}
              hideDirection
            />
          </TabsContent>
          <TabsContent value="fund" className="mt-4">
            <FundContributeTab onClose={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="transfer" className="mt-4">
            <InternalTransferForm
              onSubmit={handleTransfer}
              isPending={transfer.isPending}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
