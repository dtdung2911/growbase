"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { useInvestmentHoldings } from "@/lib/hooks/useInvestments"
import { createHoldingSchema, type CreateHoldingInput } from "@/lib/validations/investment"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { InvestmentHolding } from "@/types/app"

type HoldingFormProps = {
  holding?: InvestmentHolding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HoldingForm({ holding, open, onOpenChange }: HoldingFormProps) {
  const { t } = useTranslation()
  const { create, update } = useInvestmentHoldings()
  const isEdit = Boolean(holding)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateHoldingInput>({
    resolver: zodResolver(createHoldingSchema),
    values: {
      stock_code: holding?.stock_code ?? "",
      weight_pct: holding?.weight_pct ?? 0,
      total_invested: holding?.total_invested ?? 0,
      current_value: holding?.current_value ?? 0,
      notes: holding?.notes ?? "",
    },
  })

  const isPending = create.isPending || update.isPending

  const onSubmit = (data: CreateHoldingInput) => {
    const payload = { ...data, stock_code: data.stock_code.toUpperCase() }
    const onSuccess = () => {
      reset()
      onOpenChange(false)
    }
    if (isEdit && holding) {
      update.mutate({ id: holding.id, ...payload }, { onSuccess })
    } else {
      create.mutate(payload, { onSuccess })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? t("investment.editHolding") : t("investment.addHolding")}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="holding-code" className="text-xs">
              {t("investment.stockCode")}
            </Label>
            <Input
              id="holding-code"
              {...register("stock_code")}
              className="min-h-[44px] rounded-xl text-base uppercase"
              autoFocus
            />
            {errors.stock_code && (
              <p className="text-xs text-destructive">{errors.stock_code.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="holding-weight" className="text-xs">
              {t("investment.weight")} (%)
            </Label>
            <Input
              id="holding-weight"
              type="number"
              min={0}
              max={100}
              step={0.1}
              {...register("weight_pct", { valueAsNumber: true })}
              className="h-[44px] rounded-[18px] font-mono text-base tabular-nums"
            />
            {errors.weight_pct && (
              <p className="text-xs text-destructive">{errors.weight_pct.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="holding-invested" className="text-xs">
                {t("investment.invested")}
              </Label>
              <Controller
                name="total_invested"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="holding-invested"
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-xl"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="holding-current" className="text-xs">
                {t("investment.currentValue")}
              </Label>
              <Controller
                name="current_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="holding-current"
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-xl"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="holding-notes" className="text-xs">
              {t("investment.notes")} ({t("common.optional")})
            </Label>
            <textarea
              id="holding-notes"
              {...register("notes")}
              rows={2}
              className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base ring-offset-background transition-[border-color,box-shadow] motion-reduce:transition-none placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <Button type="submit" disabled={isPending} className="min-h-[44px] w-full rounded-xl">
            {isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
