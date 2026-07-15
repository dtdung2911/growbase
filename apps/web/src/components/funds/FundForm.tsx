"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { cn } from "@/lib/utils/cn"
import { formatVNDCompact } from "@growbase/shared/rules/currency"
import { GOAL_PRESETS, presetTargetDate } from "@/lib/constants/goalPresets"
import { useCreateFund } from "@/lib/hooks/useFunds"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { FUND_TYPE_CONFIG, type FundType } from "@growbase/shared/types/app"
import ChevronRightCircleDuotoneIcon from "@iconify-react/si/chevron-right-circle-duotone";
import {
  createFundSchema,
  type CreateFundInput,
} from "@growbase/shared/schemas/fund"

type FundFormProps = {
  open: boolean
  onClose: () => void
}

const FUND_TYPE_ORDER: FundType[] = [
  "emergency",
  "sinking",
  "goal",
  "investment",
  "freedom",
]

const DESC_KEY: Record<FundType, string> = {
  emergency: "funds.descEmergency",
  sinking: "funds.descSinking",
  goal: "funds.descGoal",
  investment: "funds.descInvestment",
  freedom: "funds.descFreedom",
}

const MONTHS_OPTIONS = [3, 6, 12]

export function FundForm({ open, onClose }: FundFormProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl"
      >
        {open && <FundFormBody onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function FundFormBody({ onClose }: { onClose: () => void }) {
  const { t, locale } = useTranslation()
  const createFund = useCreateFund()
  const [step, setStep] = useState(1)

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<CreateFundInput>({
      resolver: zodResolver(createFundSchema),
      defaultValues: {
        name: "",
        description: "",
        fund_type: undefined as unknown as FundType,
        monthly_contribution: 0,
        contribution_day: 1,
        target_amount: null,
        target_date: null,
        target_months_expense: null,
        expected_return_rate: null,
        per_member: false,
        amount_per_member: null,
      },
    })

  const fundType = watch("fund_type")
  const name = watch("name")

  const onSubmit = (data: CreateFundInput) => {
    const config = FUND_TYPE_CONFIG[data.fund_type]
    createFund.mutate(
      {
        ...data,
        icon: config.icon,
        color: config.color,
      },
      {
        onSuccess: () => {
          reset()
          setStep(1)
          onClose()
        },
      }
    )
  }

  const selectType = (type: FundType) => {
    setValue("fund_type", type)
    setStep(2)
  }

  return (
    <>
      <SheetHeader className="mb-4">
        <div className="flex items-center gap-2 text-left">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Icon icon="lucide:arrow-left" className="h-4 w-4" />
            </button>
          )}
          <SheetTitle>
            {step === 1 ? t("funds.selectType") : t("funds.createFund")}
          </SheetTitle>
        </div>
      </SheetHeader>

      {step === 1 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FUND_TYPE_ORDER.map((type) => {
            const config = FUND_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => selectType(type)}
                className="flex min-h-[44px] items-center gap-3 rounded-[13px] border border-border/40 bg-card p-3 text-left transition-colors hover:border-primary"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <Icon
                    icon={config.icon}
                    className="h-5 w-5"
                    style={{ color: config.color }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {locale === "en" ? config.labelEn : config.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(DESC_KEY[type])}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {step >= 2 && fundType && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 2 && (
            <>
              {fundType === "goal" && (
                <div className="flex flex-wrap gap-2">
                  {GOAL_PRESETS.map((preset) => (
                    <button
                      key={preset.presetId}
                      type="button"
                      onClick={() => {
                        setValue(
                          "name",
                          t(`setupV2.goal.${preset.presetId}.name`),
                        );
                        setValue("target_amount", preset.targetAmount);
                        setValue(
                          "target_date",
                          presetTargetDate(preset.targetMonths),
                        );
                      }}
                      className="min-h-[44px] rounded-full border border-border px-4 text-sm text-foreground transition-colors hover:border-primary"
                    >
                      {t(`setupV2.goal.${preset.presetId}.name`)} ·{" "}
                      {formatVNDCompact(preset.targetAmount)}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="fund-name">{t("funds.fundName")}</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="fund-name"
                      placeholder={t("funds.fundNamePlaceholder")}
                      value={field.value}
                      onChange={field.onChange}
                      className="min-h-[44px] text-base"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fund-desc">{t("funds.description")}</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="fund-desc"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className="min-h-[44px] text-base"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("funds.monthlyAmount")}</Label>
                <Controller
                  name="monthly_contribution"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value ?? 0}
                      onChange={field.onChange}
                      placeholder="0"
                      className="min-h-[44px]"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fund-day">{t("funds.contributionDay")}</Label>
                <Controller
                  name="contribution_day"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="fund-day"
                      type="number"
                      min={1}
                      max={28}
                      value={field.value ?? 1}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="min-h-[44px] text-base"
                    />
                  )}
                />
              </div>

              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={!name.trim()}
                className="min-h-[44px] w-full"
              >
                {t("funds.next")}
                <ChevronRightCircleDuotoneIcon height="12em" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              {fundType === "emergency" && (
                <div className="space-y-1.5">
                  <Label>{t("funds.targetMonths")}</Label>
                  <Controller
                    name="target_months_expense"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2">
                        {MONTHS_OPTIONS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => field.onChange(m)}
                            className={cn(
                              "min-h-[44px] rounded-lg border text-sm font-medium transition-colors",
                              field.value === m
                                ? "border-primary bg-primary-tint text-primary"
                                : "border-border bg-muted text-muted-foreground",
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              )}

              {(fundType === "sinking" ||
                fundType === "goal" ||
                fundType === "investment") && (
                <div className="space-y-1.5">
                  <Label>{t("funds.targetAmount")}</Label>
                  <Controller
                    name="target_amount"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        value={field.value ?? 0}
                        onChange={field.onChange}
                        placeholder="0"
                        className="min-h-[44px]"
                      />
                    )}
                  />
                </div>
              )}

              {(fundType === "sinking" || fundType === "goal") && (
                <div className="space-y-1.5">
                  <Label htmlFor="fund-target-date">
                    {t("funds.targetDate")}
                  </Label>
                  <Controller
                    name="target_date"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="fund-target-date"
                        type="date"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        className="min-h-[44px] text-base"
                      />
                    )}
                  />
                </div>
              )}

              {(fundType === "goal" || fundType === "investment") && (
                <div className="space-y-1.5">
                  <Label htmlFor="fund-return">{t("funds.returnRate")}</Label>
                  <Controller
                    name="expected_return_rate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="fund-return"
                        type="number"
                        step="0.1"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        className="min-h-[44px] text-base"
                      />
                    )}
                  />
                </div>
              )}

              {fundType === "freedom" && (
                <>
                  <div className="space-y-1.5">
                    <Label>{t("funds.amountPerMember")}</Label>
                    <Controller
                      name="amount_per_member"
                      control={control}
                      render={({ field }) => (
                        <CurrencyInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          placeholder="0"
                          className="min-h-[44px]"
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-3">
                    <Label htmlFor="per-member">{t("funds.perMember")}</Label>
                    <Controller
                      name="per_member"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="per-member"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={createFund.isPending}
                className="min-h-[44px] w-full"
              >
                {createFund.isPending && (
                  <Icon
                    icon="lucide:loader-2"
                    className="h-4 w-4 animate-spin"
                  />
                )}
                {t("funds.createFund")}
              </Button>
            </>
          )}
        </form>
      )}
    </>
  );
}
