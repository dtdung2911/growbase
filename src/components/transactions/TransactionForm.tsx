"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { CategoryPicker } from "@/components/transactions/CategoryPicker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useDebtEntries } from "@/lib/hooks/useDebtEntries"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from "@/lib/validations/transaction"
import type { TransactionDirection, TransactionWithJoins, BehaviorType } from "@/types/app"

type TransactionFormProps = {
  defaultDirection: TransactionDirection
  initialData?: TransactionWithJoins | null
  onSubmit: (data: CreateTransactionInput) => void
  isPending: boolean
  hideDirection?: boolean
}

export function TransactionForm({
  defaultDirection,
  initialData,
  onSubmit,
  isPending,
  hideDirection,
}: TransactionFormProps) {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId) ?? ""
  const { data: accounts = [] } = useAccounts()
  const { data: debts = [] } = useDebtEntries()

  const { control, handleSubmit, watch, setValue } =
    useForm<CreateTransactionInput>({
      resolver: zodResolver(createTransactionSchema),
      defaultValues: {
        amount: initialData?.amount ?? 0,
        direction: initialData?.direction ?? defaultDirection,
        transaction_type: initialData?.transaction_type === "income"
          ? "income"
          : initialData?.transaction_type === "debt_repayment"
            ? "debt_repayment"
            : "expense",
        category_id: initialData?.category_id ?? "",
        account_id: initialData?.account_id ?? "",
        description: initialData?.description ?? "",
        transaction_date:
          initialData?.transaction_date ??
          new Date().toISOString().slice(0, 10),
        is_unusual_income: initialData?.is_unusual_income ?? false,
        debt_entry_id: initialData?.debt_entry_id ?? null,
      },
    })

  const direction = watch("direction")
  const transactionType = watch("transaction_type")
  const isUnusual = watch("is_unusual_income")

  // R2: behavior_type = DB trigger only, readonly in UI
  const behaviorType = initialData?.behavior_type as BehaviorType | null | undefined

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Direction toggle — hidden when parent already has tabs */}
      {!hideDirection && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={direction === "out" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => {
              setValue("direction", "out")
              setValue("transaction_type", "expense")
            }}
          >
            {t("tx.expenseShort")}
          </Button>
          <Button
            type="button"
            variant={direction === "in" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => {
              setValue("direction", "in")
              setValue("transaction_type", "income")
            }}
          >
            {t("tx.incomeShort")}
          </Button>
        </div>
      )}

      {/* Amount */}
      <div className="space-y-1">
        <Label htmlFor="amount">{t("tx.amount")}</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              id="amount"
              value={field.value}
              onChange={field.onChange}
              placeholder="0"
            />
          )}
        />
      </div>

      {/* Category */}
      <div className="space-y-1">
        <Label>{t("tx.category")}</Label>
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <CategoryPicker
              householdId={householdId}
              direction={direction}
              value={field.value || null}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Account */}
      <div className="space-y-1">
        <Label>{t("tx.account")}</Label>
        <Controller
          name="account_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("tx.selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Debt entry (for debt_repayment) */}
      {transactionType === "debt_repayment" && (
        <div className="space-y-1">
          <Label>{t("tx.debt")}</Label>
          <Controller
            name="debt_entry_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("tx.selectDebt")} />
                </SelectTrigger>
                <SelectContent>
                  {debts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.creditor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      {/* Date */}
      <div className="space-y-1">
        <Label htmlFor="tx-date">{t("tx.date")}</Label>
        <Controller
          name="transaction_date"
          control={control}
          render={({ field }) => (
            <Input
              id="tx-date"
              type="date"
              value={field.value}
              onChange={field.onChange}
              className="text-base"
            />
          )}
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">{t("tx.description")}</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input
              id="description"
              placeholder={t("tx.descriptionPlaceholder")}
              value={field.value ?? ""}
              onChange={field.onChange}
              className="text-base"
            />
          )}
        />
      </div>

      {/* Unusual income toggle */}
      {direction === "in" && (
        <button
          type="button"
          onClick={() => setValue("is_unusual_income", !isUnusual)}
          className={cn(
            "flex w-full min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors motion-reduce:transition-none",
            isUnusual && "border-warning bg-warning/10"
          )}
        >
          <div
            className={cn(
              "h-4 w-4 rounded border",
              isUnusual ? "border-warning bg-warning" : "border-muted-foreground"
            )}
          />
          {t("tx.unusualIncome")}
        </button>
      )}

      {/* R2: behavior_type chip — readonly */}
      {behaviorType && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("tx.behaviorLabel")}:</span>
          <Badge variant="secondary">
            {t(`behavior.${behaviorType}`)}
          </Badge>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && (
          <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
        )}
        {isPending ? t("tx.saving") : t("common.save")}
      </Button>
    </form>
  )
}
