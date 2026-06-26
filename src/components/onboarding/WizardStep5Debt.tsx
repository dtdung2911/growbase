"use client"

import { Icon } from "@iconify/react"
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
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { useWizardStore } from "@/lib/stores/wizardStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { DebtDraft, DebtType } from "@/types/app"

const DEBT_TYPE_KEYS: { value: DebtType; key: string }[] = [
  { value: "bank_loan", key: "setup.debtType.bank_loan" },
  { value: "credit_card", key: "setup.debtType.credit_card" },
  { value: "mortgage", key: "setup.debtType.mortgage" },
  { value: "personal", key: "setup.debtType.personal" },
]

export function WizardStep5Debt() {
  const { t } = useTranslation()
  const debts = useWizardStore((s) => s.debts)
  const currency = useWizardStore((s) => s.currency)
  const setDebts = useWizardStore((s) => s.setDebts)
  const debtPct = useWizardStore((s) => s.debtPct())

  const update = (index: number, patch: Partial<DebtDraft>) => {
    setDebts(debts.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const add = () => {
    setDebts([
      ...debts,
      {
        id: crypto.randomUUID(),
        creditorName: "",
        debtType: "bank_loan",
        totalAmount: 0,
        monthlyPayment: 0,
      },
    ])
  }

  const remove = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {t("setup.step5Title")}
      </h2>

      <div className="space-y-4">
        {debts.map((debt, i) => (
          <div
            key={debt.id}
            className="space-y-3 rounded-2xl bg-card p-4 shadow-soft-xs"
          >
            <div className="flex items-center justify-between">
              <Label>{t("setup.debt", { index: i + 1 })}</Label>
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
              value={debt.creditorName}
              onChange={(e) => update(i, { creditorName: e.target.value })}
              placeholder={t("setup.creditorPlaceholder")}
            />
            <Select
              value={debt.debtType}
              onValueChange={(v) =>
                update(i, { debtType: v as DebtType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEBT_TYPE_KEYS.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {t(dt.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label>{t("setup.monthlyPayment")}</Label>
              <CurrencyInput
                value={debt.monthlyPayment}
                currency={currency}
                onChange={(v) => update(i, { monthlyPayment: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("setup.remainingBalance")}</Label>
              <CurrencyInput
                value={debt.remainingAmount ?? 0}
                currency={currency}
                onChange={(v) => update(i, { remainingAmount: v })}
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={add} className="w-full">
        <Icon icon="lucide:plus" className="h-4 w-4" />
        {t("setup.addDebt")}
      </Button>

      {debts.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
          <span className="text-sm text-muted-foreground">{t("setup.debtBudget")}</span>
          <span className="font-mono text-base font-semibold tabular-nums">
            {t("setup.debtBudgetValue", { pct: debtPct.toFixed(1) })}
          </span>
        </div>
      )}
    </div>
  )
}
