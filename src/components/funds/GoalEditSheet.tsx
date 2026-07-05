"use client"

import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { useUpdateFund } from "@/lib/hooks/useFunds"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Fund } from "@/types/app"

type GoalEditSheetProps = {
  fund: Fund
  open: boolean
  onClose: () => void
}

type GoalEditValues = {
  name: string
  target_amount: number
  target_date: string
}

export function GoalEditSheet({ fund, open, onClose }: GoalEditSheetProps) {
  const { t } = useTranslation()
  const updateFund = useUpdateFund(fund.id)

  const { control, handleSubmit, setError } = useForm<GoalEditValues>({
    defaultValues: {
      name: fund.name,
      target_amount: fund.target_amount ?? 0,
      target_date: fund.target_date ?? "",
    },
  })

  const onSubmit = (values: GoalEditValues) => {
    if (values.target_date <= format(new Date(), "yyyy-MM-dd")) {
      setError("target_date", { message: t("funds.deadlineFuture") })
      return
    }
    updateFund.mutate(values, { onSuccess: onClose })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[18px]">
        <SheetHeader>
          <SheetTitle>{t("funds.editGoal")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">{t("funds.fundName")}</Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Input id="goal-name" value={field.value} onChange={field.onChange} className="min-h-[44px] text-base" />
              )}
            />
          </div>

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
            <Label htmlFor="goal-target-date">{t("funds.targetDate")}</Label>
            <Controller
              name="target_date"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    id="goal-target-date"
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

          <Button type="submit" disabled={updateFund.isPending} className="min-h-[44px] w-full">
            {t("common.save")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
