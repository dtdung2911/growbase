"use client"

import { useState } from "react"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { Label } from "@/components/ui/label"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { monthlyIncomeSchema } from "@/lib/validations/onboardingV2"
import { estimateEmergencyTarget } from "@/lib/constants/budgetTemplate"
import { useTranslation } from "@/lib/i18n/useTranslation"

export function IncomeStep() {
  const { t } = useTranslation()
  const monthlyIncome = useOnboardingV2Store((s) => s.monthlyIncome)
  const setMonthlyIncome = useOnboardingV2Store((s) => s.setMonthlyIncome)
  const goal = useOnboardingV2Store((s) => s.goal)
  const setGoal = useOnboardingV2Store((s) => s.setGoal)
  const [touched, setTouched] = useState(false)

  const incomeValid = monthlyIncomeSchema.safeParse(monthlyIncome).success
  const showEmergencyPreview = goal?.presetId === "emergency" && incomeValid

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("setupV2.income.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("setupV2.income.householdHint")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="household-income">{t("setupV2.income.inputLabel")}</Label>
        <CurrencyInput
          id="household-income"
          value={monthlyIncome ?? 0}
          onChange={(v) => {
            setTouched(true)
            setMonthlyIncome(v || null)
          }}
        />
        {touched && !incomeValid && (
          <p className="text-sm text-destructive">{t("setupV2.income.error")}</p>
        )}
      </div>

      {showEmergencyPreview && goal && (
        <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
          <div>
            <p className="font-semibold text-foreground">{t("setupV2.income.emergencyTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("setupV2.income.emergencyDesc")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency-target">{t("setupV2.income.emergencyEditLabel")}</Label>
            <CurrencyInput
              id="emergency-target"
              // targetAmount null = "auto" — recompute theo income; user sửa → giữ giá trị user
              value={goal.targetAmount ?? estimateEmergencyTarget(monthlyIncome ?? 0)}
              onChange={(v) => setGoal({ ...goal, targetAmount: v || null })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
