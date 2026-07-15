"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { useInvestmentPurchases } from "@/lib/hooks/useInvestments"
import { createPurchaseSchema, type CreatePurchaseInput } from "@growbase/shared/schemas/investment"
import { useTranslation } from "@/lib/i18n/useTranslation"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { InvestmentHolding } from "@growbase/shared/types/app"

type PurchaseFormProps = {
  holdings: InvestmentHolding[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseForm({ holdings, open, onOpenChange }: PurchaseFormProps) {
  const { t } = useTranslation()
  const { create } = useInvestmentPurchases()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: {
      holding_id: "",
      purchase_month: new Date().toISOString().slice(0, 7),
      budget: 0,
      price: 0,
      fees: 0,
      quantity: 0,
      amount: 0,
      end_value: 0,
      monthly_return: 0,
      notes: "",
    },
  })

  const onSubmit = (data: CreatePurchaseInput) => {
    create.mutate(data, {
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("investment.addPurchase")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("investment.stockCode")}</Label>
            <Controller
              name="holding_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="min-h-[44px] rounded-xl">
                    <SelectValue placeholder={t("investment.selectHolding")} />
                  </SelectTrigger>
                  <SelectContent>
                    {holdings.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.stock_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.holding_id && (
              <p className="text-xs text-destructive">{errors.holding_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchase-month" className="text-xs">
              {t("investment.purchaseMonth")}
            </Label>
            <Input
              id="purchase-month"
              type="month"
              {...register("purchase_month")}
              className="min-h-[44px] rounded-xl text-base"
            />
            {errors.purchase_month && (
              <p className="text-xs text-destructive">{errors.purchase_month.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchase-budget" className="text-xs">
                {t("investment.budget")}
              </Label>
              <Controller
                name="budget"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="purchase-budget"
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-xl"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchase-price" className="text-xs">
                {t("investment.price")}
              </Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="purchase-price"
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-xl"
                  />
                )}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchase-quantity" className="text-xs">
                {t("investment.quantity")}
              </Label>
              <Input
                id="purchase-quantity"
                type="number"
                min={0}
                step="any"
                {...register("quantity", { valueAsNumber: true })}
                className="min-h-[44px] rounded-xl font-mono text-base tabular-nums"
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchase-fees" className="text-xs">
                {t("investment.fees")}
              </Label>
              <Controller
                name="fees"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="purchase-fees"
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-xl"
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchase-amount" className="text-xs">
                {t("investment.amount")}
              </Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="purchase-amount"
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-xl"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchase-end" className="text-xs">
                {t("investment.endValue")}
              </Label>
              <Controller
                name="end_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="purchase-end"
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-xl"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchase-return" className="text-xs">
              {t("investment.monthlyReturn")} (%)
            </Label>
            <Input
              id="purchase-return"
              type="number"
              step="any"
              {...register("monthly_return", { valueAsNumber: true })}
              className="min-h-[44px] rounded-xl font-mono text-base tabular-nums"
            />
          </div>

          <Button type="submit" disabled={create.isPending} className="min-h-[44px] w-full rounded-xl">
            {create.isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {create.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
