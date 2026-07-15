"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { useCreateEventBudget } from "@/lib/hooks/useEventBudgets"
import {
  createEventBudgetSchema,
  type CreateEventBudgetInput,
} from "@growbase/shared/schemas/event-budget"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/CurrencyInput"

type EventBudgetFormProps = {
  onSuccess: () => void
}

export function EventBudgetForm({ onSuccess }: EventBudgetFormProps) {
  const { t } = useTranslation()
  const create = useCreateEventBudget()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateEventBudgetInput>({
    resolver: zodResolver(createEventBudgetSchema),
    defaultValues: {
      name: "",
      total_budget: 0,
      event_date: null,
      notes: null,
    },
  })

  const onSubmit = (data: CreateEventBudgetInput) => {
    create.mutate(data, { onSuccess })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div>
        <Label htmlFor="eb-name">{t("eventBudget.name")}</Label>
        <Input
          id="eb-name"
          {...register("name")}
          className="mt-1.5 min-h-[44px] text-base"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="eb-budget">{t("eventBudget.totalBudget")}</Label>
        <Controller
          name="total_budget"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              id="eb-budget"
              value={field.value}
              onChange={field.onChange}
              className="mt-1.5 font-mono"
            />
          )}
        />
        {errors.total_budget && (
          <p className="mt-1 text-xs text-destructive">
            {errors.total_budget.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="eb-date">
          {t("eventBudget.eventDate")} ({t("common.optional")})
        </Label>
        <Input
          id="eb-date"
          type="date"
          {...register("event_date")}
          className="mt-1.5 min-h-[44px] text-base"
        />
      </div>

      <div>
        <Label htmlFor="eb-notes">
          {t("eventBudget.notes")} ({t("common.optional")})
        </Label>
        <Input
          id="eb-notes"
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
