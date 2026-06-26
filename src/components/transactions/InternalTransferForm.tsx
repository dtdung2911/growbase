"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useTranslation } from "@/lib/i18n/useTranslation"
import {
  createTransferSchema,
  type CreateTransferInput,
} from "@/lib/validations/transaction"

type InternalTransferFormProps = {
  onSubmit: (data: CreateTransferInput) => void
  isPending: boolean
}

export function InternalTransferForm({
  onSubmit,
  isPending,
}: InternalTransferFormProps) {
  const { t } = useTranslation()
  const { data: accounts = [] } = useAccounts()

  const { control, handleSubmit, watch } = useForm<CreateTransferInput>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      from_account_id: "",
      to_account_id: "",
      amount: 0,
      description: "",
      transaction_date: new Date().toISOString().slice(0, 10),
      is_credit_card_payment: false,
    },
  })

  const fromId = watch("from_account_id")
  const toId = watch("to_account_id")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Amount */}
      <div className="space-y-1">
        <Label htmlFor="transfer-amount">{t("tx.amount")}</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              id="transfer-amount"
              value={field.value}
              onChange={field.onChange}
              placeholder="0"
            />
          )}
        />
      </div>

      {/* From account */}
      <div className="space-y-1">
        <Label>{t("tx.fromAccount")}</Label>
        <Controller
          name="from_account_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("tx.selectFromAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== toId)
                  .map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* To account */}
      <div className="space-y-1">
        <Label>{t("tx.toAccount")}</Label>
        <Controller
          name="to_account_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("tx.selectToAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== fromId)
                  .map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Date */}
      <div className="space-y-1">
        <Label htmlFor="transfer-date">{t("tx.date")}</Label>
        <Controller
          name="transaction_date"
          control={control}
          render={({ field }) => (
            <Input
              id="transfer-date"
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
        <Label htmlFor="transfer-desc">{t("tx.description")}</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input
              id="transfer-desc"
              placeholder={t("tx.descriptionPlaceholder")}
              value={field.value ?? ""}
              onChange={field.onChange}
              className="text-base"
            />
          )}
        />
      </div>

      {/* D5: CC payment toggle */}
      <div className="flex items-center justify-between rounded-xl border px-3 py-2">
        <Label htmlFor="cc-toggle" className="text-sm">
          {t("tx.ccPayment")}
        </Label>
        <Controller
          name="is_credit_card_payment"
          control={control}
          render={({ field }) => (
            <Switch
              id="cc-toggle"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && (
          <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
        )}
        {isPending ? t("tx.transferring") : t("tx.transfer")}
      </Button>
    </form>
  )
}
