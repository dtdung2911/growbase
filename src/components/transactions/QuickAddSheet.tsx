"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { InternalTransferForm } from "@/components/transactions/InternalTransferForm"
import { useCreateTransaction } from "@/lib/hooks/useTransactions"
import { useTransfer } from "@/lib/hooks/useTransfer"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { CreateTransactionInput, CreateTransferInput } from "@/lib/validations/transaction"

type QuickAddSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const { t } = useTranslation()
  const createTx = useCreateTransaction()
  const transfer = useTransfer()

  const handleExpense = (data: CreateTransactionInput) => {
    createTx.mutate(data, { onSuccess: () => onOpenChange(false) })
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
            <TabsTrigger value="transfer" className="flex-1 text-xs">{t("tx.transferShort")}</TabsTrigger>
          </TabsList>
          <TabsContent value="expense" className="mt-4">
            <TransactionForm
              defaultDirection="out"
              onSubmit={handleExpense}
              isPending={createTx.isPending}
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
