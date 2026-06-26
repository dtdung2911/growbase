"use client"

import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { useWizardStore } from "@/lib/stores/wizardStore"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { IncomeDraft } from "@/types/app"

export function WizardStep3Income() {
  const { t } = useTranslation()
  const incomes = useWizardStore((s) => s.incomes)
  const currency = useWizardStore((s) => s.currency)
  const setIncomes = useWizardStore((s) => s.setIncomes)
  const totalIncome = useWizardStore((s) => s.totalIncome())

  const update = (index: number, patch: Partial<IncomeDraft>) => {
    setIncomes(incomes.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const add = () => {
    setIncomes([
      ...incomes,
      { id: crypto.randomUUID(), sourceName: "", monthlyAmount: 0 },
    ])
  }

  const remove = (index: number) => {
    setIncomes(incomes.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("setup.step3Title")}</h2>

      {incomes.length === 0 ? (
        <div className="rounded-2xl bg-card p-6 text-center shadow-soft-xs">
          <p className="text-sm text-muted-foreground">{t("setup.emptyIncome")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {incomes.map((income, i) => (
            <div
              key={income.id}
              className="space-y-3 rounded-2xl bg-card p-4 shadow-soft-xs"
            >
              <div className="flex items-center justify-between">
                <Label>{t("setup.incomeSource", { index: i + 1 })}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                >
                  <Icon icon="lucide:x" className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={income.sourceName}
                onChange={(e) => update(i, { sourceName: e.target.value })}
                placeholder={t("setup.incomeSourcePlaceholder")}
              />
              <CurrencyInput
                value={income.monthlyAmount}
                currency={currency}
                onChange={(v) => update(i, { monthlyAmount: v })}
                placeholder={t("setup.amountPlaceholder")}
              />
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" onClick={add} className="w-full">
        <Icon icon="lucide:plus" className="h-4 w-4" />
        {t("setup.addIncome")}
      </Button>

      <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
        <span className="text-sm text-muted-foreground">{t("setup.totalIncome")}</span>
        <span className="font-mono text-base font-semibold tabular-nums text-emerald-400">
          {formatVND(totalIncome)}
        </span>
      </div>
    </div>
  )
}
