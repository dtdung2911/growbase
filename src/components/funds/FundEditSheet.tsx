"use client"

import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Icon } from "@iconify/react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { cn } from "@/lib/utils/cn"
import { useUpdateFund } from "@/lib/hooks/useFunds"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { PRESET_ICON_NAMES, CUSTOM_ICON_CHOICES } from "@/components/onboarding/v2/goalPresetIcons"
import type { UpdateFundInput } from "@/lib/validations/fund"
import type { Fund } from "@/types/app"

type FundEditSheetProps = {
  fund: Fund
  open: boolean
  onClose: () => void
}

type FundEditValues = {
  name: string
  icon: string
  target_amount: number
  target_date: string
  target_months_expense: number
}

export function FundEditSheet({ fund, open, onClose }: FundEditSheetProps) {
  const { t } = useTranslation()
  const updateFund = useUpdateFund(fund.id)
  const isEmergency = fund.fund_type === "emergency"

  const presets = isEmergency
    ? [PRESET_ICON_NAMES.emergency]
    : [PRESET_ICON_NAMES.education, PRESET_ICON_NAMES.house, PRESET_ICON_NAMES.travel]
  const iconChoices = Array.from(
    new Set([fund.icon, ...presets, ...CUSTOM_ICON_CHOICES].filter(Boolean) as string[])
  )

  const { control, handleSubmit, setError } = useForm<FundEditValues>({
    defaultValues: {
      name: fund.name,
      icon: fund.icon ?? "",
      target_amount: fund.target_amount ?? 0,
      target_date: fund.target_date ?? "",
      target_months_expense: fund.target_months_expense ?? 6,
    },
  })

  const onSubmit = (values: FundEditValues) => {
    const payload: UpdateFundInput = { name: values.name, icon: values.icon || undefined }
    if (isEmergency) {
      payload.target_months_expense = values.target_months_expense
    } else {
      if (values.target_date <= format(new Date(), "yyyy-MM-dd")) {
        setError("target_date", { message: t("funds.deadlineFuture") })
        return
      }
      payload.target_amount = values.target_amount
      payload.target_date = values.target_date
    }
    updateFund.mutate(payload, { onSuccess: onClose })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[18px]">
        <SheetHeader>
          <SheetTitle>{isEmergency ? t("funds.editEmergency") : t("funds.editGoal")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fund-name">{t("funds.fundName")}</Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Input id="fund-name" value={field.value} onChange={field.onChange} className="min-h-[44px] text-base" />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("funds.chooseIcon")}</Label>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-6 gap-2">
                  {iconChoices.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => field.onChange(ic)}
                      aria-label={ic}
                      className={cn(
                        "flex min-h-[44px] items-center justify-center rounded-[13px] border transition-colors",
                        field.value === ic
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      <Icon icon={ic} className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {isEmergency ? (
            <div className="space-y-1.5">
              <Label htmlFor="fund-months">{t("funds.targetMonths")}</Label>
              <Controller
                name="target_months_expense"
                control={control}
                rules={{ required: true, min: 1, max: 24 }}
                render={({ field }) => (
                  <Input
                    id="fund-months"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={24}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    className="min-h-[44px] text-base font-mono tabular-nums"
                  />
                )}
              />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>{t("funds.targetAmount")}</Label>
                <Controller
                  name="target_amount"
                  control={control}
                  rules={{ min: 1 }}
                  render={({ field }) => (
                    <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" className="min-h-[44px]" />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fund-target-date">{t("funds.targetDate")}</Label>
                <Controller
                  name="target_date"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id="fund-target-date"
                        type="date"
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-[44px] text-base"
                      />
                      {fieldState.error?.message && (
                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                      )}
                    </>
                  )}
                />
              </div>
            </>
          )}

          <Button type="submit" disabled={updateFund.isPending} className="min-h-[44px] w-full">
            {t("common.save")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
