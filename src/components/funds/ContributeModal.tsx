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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils/cn"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useFundContribute } from "@/lib/hooks/useFunds"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND, formatVNDCompact } from "@/lib/utils/currency"
import { FUND_TYPE_CONFIG } from "@/types/app"
import {
  fundContributeSchema,
  type FundContributeInput,
} from "@/lib/validations/fund"
import type { Fund } from "@/types/app"

type ContributeModalProps = {
  fund: Fund | null
  open: boolean
  onClose: () => void
  // Gợi ý góp theo kế hoạch tháng (BR-OB-009..011); null = không gợi ý, dùng monthly cũ.
  suggestedAmount?: number | null
}

export function ContributeModal({ fund, open, onClose, suggestedAmount }: ContributeModalProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl"
      >
        {fund && (
          <ContributeForm fund={fund} onClose={onClose} suggestedAmount={suggestedAmount} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function ContributeForm({
  fund,
  onClose,
  suggestedAmount,
}: {
  fund: Fund
  onClose: () => void
  suggestedAmount?: number | null
}) {
  const { t } = useTranslation()
  const { data: accounts = [] } = useAccounts()
  const contribute = useFundContribute(fund.id)
  const config = FUND_TYPE_CONFIG[fund.fund_type]
  const monthly = fund.monthly_contribution ?? 0

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<FundContributeInput>({
      resolver: zodResolver(fundContributeSchema),
      defaultValues: {
        amount: suggestedAmount ?? monthly,
        account_id: "",
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
  const balanceAfter = fund.current_balance + (amount || 0)
  const progressAfter =
    fund.target_amount && fund.target_amount > 0
      ? Math.min((balanceAfter / fund.target_amount) * 100, 100)
      : null

  const presets = [
    { label: t("funds.preset50"), value: Math.floor(monthly * 0.5) },
    { label: t("funds.presetStandard"), value: monthly },
    { label: t("funds.preset2x"), value: monthly * 2 },
  ]

  const onSubmit = (data: FundContributeInput) => {
    contribute.mutate(data, {
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
              {t("funds.deposit")} · {fund.name}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="contribute-amount">{t("funds.depositAmount")}</Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="contribute-amount"
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
                className="h-14 text-center text-2xl"
              />
            )}
          />
          {suggestedAmount != null && (
            <p className="text-xs text-muted-foreground">
              {t("funds.suggestCaption")}:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {formatVND(suggestedAmount)}
              </span>
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setValue("amount", p.value)}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                  amount === p.value
                    ? "border-primary bg-primary-tint text-primary"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                <span className="text-[10px] opacity-70">{p.label}</span>
                <span className="font-mono tabular-nums">
                  {formatVNDCompact(p.value)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("funds.account")}</Label>
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
          <Label htmlFor="contribute-date">{t("funds.date")}</Label>
          <Controller
            name="transaction_date"
            control={control}
            render={({ field }) => (
              <Input
                id="contribute-date"
                type="date"
                value={field.value}
                onChange={field.onChange}
                className="min-h-[44px] text-base"
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contribute-desc">{t("funds.note")}</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                id="contribute-desc"
                placeholder={t("funds.notePlaceholder")}
                value={field.value ?? ""}
                onChange={field.onChange}
                className="min-h-[44px] text-base"
              />
            )}
          />
        </div>

        <div className="rounded-lg bg-muted px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("funds.balanceAfter")}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-ink">
              {formatVND(balanceAfter)}
            </span>
          </div>
          {progressAfter !== null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full [transition:width_300ms_ease]"
                style={{
                  width: `${progressAfter}%`,
                  backgroundColor: fund.color || config.color,
                }}
              />
            </div>
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
            disabled={contribute.isPending || !amount}
            className="min-h-[44px]"
          >
            {contribute.isPending && (
              <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
            )}
            {t("funds.deposit")}
          </Button>
        </div>
      </form>
    </>
  )
}
