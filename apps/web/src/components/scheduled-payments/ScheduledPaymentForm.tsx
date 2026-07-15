"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { useCreateScheduledPayment } from "@/lib/hooks/useScheduledPayments"
import { scheduledPaymentCreateSchema, type ScheduledPaymentCreateInput } from "@growbase/shared/schemas/scheduled-payment"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ScheduledPaymentFormProps = {
  onSuccess: () => void
}

export function ScheduledPaymentForm({ onSuccess }: ScheduledPaymentFormProps) {
  const { t } = useTranslation()
  const create = useCreateScheduledPayment()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ScheduledPaymentCreateInput>({
    resolver: zodResolver(scheduledPaymentCreateSchema),
    defaultValues: {
      period: "monthly",
      next_due_date: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = (data: ScheduledPaymentCreateInput) => {
    create.mutate(data, { onSuccess })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="sp-name">{t("scheduledPayments.name")}</Label>
        <Input id="sp-name" {...register("name")} className="mt-1.5 min-h-[44px] text-base" />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="sp-amount">{t("scheduledPayments.amount")}</Label>
        <Input
          id="sp-amount"
          type="number"
          {...register("amount", { valueAsNumber: true })}
          className="mt-1.5 min-h-[44px] text-base font-mono"
        />
        {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      <div>
        <Label>{t("scheduledPayments.period")}</Label>
        <Controller
          name="period"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="mt-1.5 min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t("scheduledPayments.monthly")}</SelectItem>
                <SelectItem value="quarterly">{t("scheduledPayments.quarterly")}</SelectItem>
                <SelectItem value="yearly">{t("scheduledPayments.yearly")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <Label htmlFor="sp-due">{t("scheduledPayments.nextDueDate")}</Label>
        <Input
          id="sp-due"
          type="date"
          {...register("next_due_date")}
          className="mt-1.5 min-h-[44px] text-base"
        />
        {errors.next_due_date && <p className="mt-1 text-xs text-destructive">{errors.next_due_date.message}</p>}
      </div>

      <div>
        <Label htmlFor="sp-method">{t("scheduledPayments.paymentMethod")} ({t("scheduledPayments.optional")})</Label>
        <Input
          id="sp-method"
          {...register("payment_method")}
          className="mt-1.5 min-h-[44px] text-base"
          placeholder={t("scheduledPayments.paymentMethodPlaceholder")}
        />
      </div>

      <div>
        <Label htmlFor="sp-notes">{t("scheduledPayments.notes")} ({t("scheduledPayments.optional")})</Label>
        <Input
          id="sp-notes"
          {...register("notes")}
          className="mt-1.5 min-h-[44px] text-base"
        />
      </div>

      <Button
        type="submit"
        disabled={create.isPending}
        className="w-full min-h-[44px]"
      >
        {create.isPending ? (
          <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
        ) : (
          t("common.save")
        )}
      </Button>
    </form>
  )
}
