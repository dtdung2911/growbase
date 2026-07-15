"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useFundWithdraw } from "@/lib/hooks/useFunds"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import { FUND_TYPE_CONFIG } from "@growbase/shared/types/app"
import {
  fundWithdrawSchema,
  type FundWithdrawInput,
} from "@growbase/shared/schemas/fund"
import type { Fund } from "@growbase/shared/types/app"

type WithdrawModalProps = {
  fund: Fund | null
  open: boolean
  onClose: () => void
}

export function WithdrawModal({ fund, open, onClose }: WithdrawModalProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl"
      >
        {fund && <WithdrawFormBody fund={fund} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function WithdrawFormBody({ fund, onClose }: { fund: Fund; onClose: () => void }) {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId) ?? ""
  const { data: accounts = [] } = useAccounts()
  const withdraw = useFundWithdraw(fund.id)
  const config = FUND_TYPE_CONFIG[fund.fund_type]

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FundWithdrawInput>({
      resolver: zodResolver(fundWithdrawSchema),
      defaultValues: {
        amount: 0,
        account_id: "",
        category_id: "",
        description: "",
        transaction_date: new Date().toISOString().slice(0, 10),
      },
    })

  useEffect(() => {
    if (accounts.length > 0) {
      setValue("account_id", accounts[0].id)
    }
  }, [accounts, setValue])

  const amount = watch("amount")
  const description = watch("description")
  const exceedsBalance = amount > fund.current_balance
  const reasonMissing = !description || description.trim().length === 0

  const onSubmit = (data: FundWithdrawInput) => {
    if (exceedsBalance) return
    withdraw.mutate(data, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <>
      <SheetHeader className="mb-4">
        <div className="flex items-center gap-3 text-left">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon icon={fund.icon || config.icon} className="h-5 w-5" style={{ color: config.color }} />
          </div>
          <div>
            <SheetTitle>
              {t("funds.withdraw")} · {fund.name}
            </SheetTitle>
            <p className="text-xs text-muted-foreground">
              {t("funds.currentBalance")}:{" "}
              <span className="font-mono tabular-nums">
                {formatVND(fund.current_balance)}
              </span>
            </p>
          </div>
        </div>
      </SheetHeader>

      <div className="mb-4 rounded-r-lg border-l-[3px] border-success bg-success/10 px-3 py-2.5">
        <p className="text-xs leading-relaxed text-foreground">
          {t("funds.withdrawWarning")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="withdraw-amount">{t("funds.withdrawAmount")}</Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="withdraw-amount"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
                className="h-14 text-center text-2xl"
              />
            )}
          />
          {exceedsBalance && (
            <p className="text-xs text-destructive">{t("funds.exceedsBalance")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t("funds.expenseCategory")}</Label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <CategoryPicker
                householdId={householdId}
                direction="out"
                value={field.value || null}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("funds.receivingAccount")}</Label>
          <Controller
            name="account_id"
            control={control}
            render={({ field }) => (
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
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="withdraw-date">{t("funds.date")}</Label>
          <Controller
            name="transaction_date"
            control={control}
            render={({ field }) => (
              <Input
                id="withdraw-date"
                type="date"
                value={field.value}
                onChange={field.onChange}
                className="min-h-[44px] text-base"
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="withdraw-desc">{t("funds.withdrawReason")}</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                id="withdraw-desc"
                placeholder={t("funds.withdrawReasonPlaceholder")}
                value={field.value ?? ""}
                onChange={field.onChange}
                className="min-h-[44px] text-base"
              />
            )}
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.type === "too_big"
                ? t("funds.withdrawReasonMax")
                : t("funds.withdrawReasonRequired")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-[44px]"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={withdraw.isPending || exceedsBalance || reasonMissing}
            className="min-h-[44px] bg-warning text-white hover:opacity-90"
          >
            {withdraw.isPending && (
              <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
            )}
            {t("funds.withdraw")}
          </Button>
        </div>
      </form>
    </>
  )
}
