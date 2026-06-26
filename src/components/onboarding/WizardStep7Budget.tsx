"use client"

import { Icon } from "@iconify/react"
import { Input } from "@/components/ui/input"
import { useWizardStore } from "@/lib/stores/wizardStore"
import { formatVND } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/cn"
import { useTranslation } from "@/lib/i18n/useTranslation"

const DEBT_BUDGET_NAME = "Chi trả nợ"

export function WizardStep7Budget() {
  const { t } = useTranslation()
  const budgetPcts = useWizardStore((s) => s.budgetPcts)
  const setBudgetPct = useWizardStore((s) => s.setBudgetPct)
  const totalIncome = useWizardStore((s) => s.totalIncome())
  const totalBudgetPct = useWizardStore((s) => s.totalBudgetPct())
  const hasDebts = useWizardStore((s) => s.debts.length > 0)

  const over = totalBudgetPct > 100

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("setup.step7Title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("setup.step7Subtitle", { amount: formatVND(totalIncome) })}
        </p>
      </div>

      <div className="space-y-2">
        {budgetPcts.map((line) => {
          const locked = line.name === DEBT_BUDGET_NAME && hasDebts
          const amount = Math.round((line.budgetPct / 100) * totalIncome)
          return (
            <div
              key={line.name}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.name}</p>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatVND(amount)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {locked ? (
                  <Icon icon="lucide:lock" className="h-4 w-4 text-muted-foreground" />
                ) : null}
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  disabled={locked}
                  value={line.budgetPct}
                  onChange={(e) =>
                    setBudgetPct(
                      line.name,
                      Math.min(100, Math.max(0, Number(e.target.value) || 0))
                    )
                  }
                  className="w-20 text-right font-mono tabular-nums"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
        <span className="text-sm text-muted-foreground">{t("setup.step7Total")}</span>
        <span
          className={cn(
            "font-mono text-base font-semibold tabular-nums",
            over ? "text-rose-400" : "text-emerald-400"
          )}
        >
          {totalBudgetPct.toFixed(1)}% / 100%
        </span>
      </div>

      <div className="rounded-2xl bg-primary/5 p-4 text-sm text-primary">
        {t("setup.step7Note")}
      </div>
    </div>
  )
}
