"use client"

import { useState } from "react"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { Label } from "@/components/ui/label"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { monthlyIncomeSchema } from "@/lib/validations/onboardingV2"
import { estimateEmergencyTarget } from "@/lib/constants/budgetTemplate"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"

export function IncomeStep() {
  const { t } = useTranslation()
  const monthlyIncome = useOnboardingV2Store((s) => s.monthlyIncome)
  const setMonthlyIncome = useOnboardingV2Store((s) => s.setMonthlyIncome)
  const [touched, setTouched] = useState(false)

  const incomeValid = monthlyIncomeSchema.safeParse(monthlyIncome).success

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

      {incomeValid && (
        <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
          <div>
            <p className="font-semibold text-foreground">{t("setupV2.income.emergencyTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("setupV2.income.emergencyAutoDesc")}
            </p>
          </div>
          {/* Quỹ khẩn cấp là implicit, target luôn tự tính từ thu nhập (server) — read-only ở đây */}
          <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {formatVND(estimateEmergencyTarget(monthlyIncome ?? 0))}
          </p>
        </div>
      )}
    </div>
  )
}
