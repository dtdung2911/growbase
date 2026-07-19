"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { useCreateEventBudgetItem } from "@/lib/hooks/useEventBudgets"
import {
  createEventBudgetItemSchema,
  type CreateEventBudgetItemInput,
} from "@growbase/shared/schemas/event-budget"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/CurrencyInput"

type EventBudgetItemFormProps = {
  eventBudgetId: string
  onSuccess: () => void
}

export function EventBudgetItemForm({
  eventBudgetId,
  onSuccess,
}: EventBudgetItemFormProps) {
  const { t } = useTranslation()
  const create = useCreateEventBudgetItem()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateEventBudgetItemInput>({
    resolver: zodResolver(createEventBudgetItemSchema),
    defaultValues: {
      event_budget_id: eventBudgetId,
      name: "",
      planned_amount: 0,
      actual_amount: 0,
      notes: null,
    },
  })

  const onSubmit = (data: CreateEventBudgetItemInput) => {
    create.mutate(data, { onSuccess })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div>
        <Label htmlFor="ebi-name">{t("eventBudget.itemName")}</Label>
        <Input
          id="ebi-name"
          {...register("name")}
          className="mt-1.5 min-h-[44px] text-base"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="ebi-planned">{t("eventBudget.planned")}</Label>
        <Controller
          name="planned_amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              id="ebi-planned"
              value={field.value}
              onChange={field.onChange}
              className="mt-1.5 font-mono"
            />
          )}
        />
        {errors.planned_amount && (
          <p className="mt-1 text-xs text-destructive">
            {errors.planned_amount.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="ebi-actual">{t("eventBudget.actual")}</Label>
        <Controller
          name="actual_amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              id="ebi-actual"
              value={field.value}
              onChange={field.onChange}
              className="mt-1.5 font-mono"
            />
          )}
        />
        {errors.actual_amount && (
          <p className="mt-1 text-xs text-destructive">
            {errors.actual_amount.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="ebi-notes">
          {t("eventBudget.notes")} ({t("common.optional")})
        </Label>
        <Input
          id="ebi-notes"
          {...register("notes")}
          className="mt-1.5 min-h-[44px] text-base"
        />
      </div>

      <Button type="submit" disabled={create.isPending} className="w-full min-h-[44px]">
        {create.isPending ? (
          <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
        ) : (
          t("common.save")
        )}
      </Button>
    </form>
  )
}
