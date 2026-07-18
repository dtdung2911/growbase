"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategoryPicker } from "@/components/transactions/CategoryPicker"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useFundExpense } from "@/lib/hooks/useFunds"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import { fundExpenseSchema, type FundExpenseInput } from "@growbase/shared/schemas/fund"
import type { Fund } from "@growbase/shared/types/app"

// Chi từ quỹ ngay tại trang quỹ (19-7): expense với category user chọn + fund_id.
export function FundExpenseModal({
  fund,
  open,
  onClose,
}: {
  fund: Fund
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId) ?? ""
  const { data: accounts = [] } = useAccounts()
  const fundExpense = useFundExpense()

  const { control, handleSubmit, watch, reset } = useForm<FundExpenseInput>({
    resolver: zodResolver(fundExpenseSchema),
    defaultValues: {
      amount: 0,
      category_id: "",
      account_id: "",
      description: "",
      transaction_date: new Date().toISOString().slice(0, 10),
    },
  })

  const amount = watch("amount") || 0
  const balanceAfter = fund.current_balance - amount

  const onSubmit = (data: FundExpenseInput) => {
    fundExpense.mutate(
      { ...data, fund_id: fund.id },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {t("funds.spendFromFund")} · {fund.name}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>{t("tx.amount")}</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <CurrencyInput value={field.value} onChange={field.onChange} />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t("funds.balance")}:{" "}
              <span className="font-mono tabular-nums">{formatVND(fund.current_balance)}</span>
              {amount > 0 && (
                <>
                  {" → "}
                  <span className={balanceAfter < 0 ? "text-destructive" : "font-mono tabular-nums"}>
                    {formatVND(balanceAfter)}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("tx.category")}</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <CategoryPicker
                    householdId={householdId}
                    direction="out"
                    value={field.value || null}
                    onChange={field.onChange}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("funds.account")}</Label>
            <Controller
              name="account_id"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder={t("funds.selectAccount")} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-xs text-destructive">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("tx.date")}</Label>
            <Controller
              name="transaction_date"
              control={control}
              render={({ field }) => <Input type="date" {...field} />}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("tx.note")}</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder={t("tx.note")} />
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={fundExpense.isPending}>
            {t("funds.spendFromFund")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
