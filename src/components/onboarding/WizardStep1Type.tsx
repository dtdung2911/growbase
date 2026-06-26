"use client"

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { useWizardStore } from "@/lib/stores/wizardStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/cn"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Currency, HouseholdType } from "@/types/app"
import type { HouseholdInput } from "@/lib/validations/household"

interface WizardStep1TypeProps {
  defaultName: string
  onDraftChange: (draft: HouseholdInput | null) => void
}

export function WizardStep1Type({
  defaultName,
  onDraftChange,
}: WizardStep1TypeProps) {
  const { t } = useTranslation()
  const householdType = useWizardStore((s) => s.householdType)
  const currency = useWizardStore((s) => s.currency)

  const setHousehold = useWizardStore((s) => s.setHousehold)
  const householdId = useWizardStore((s) => s.householdId)

  const [name, setName] = useState(defaultName)
  const [type, setType] = useState<HouseholdType | null>(householdType)
  const [cur, setCur] = useState<Currency>(currency)

  const handleTypeChange = (newType: HouseholdType) => {
    setType(newType)
    setHousehold(householdId ?? "", newType, cur)
  }

  const handleCurrencyChange = (c: Currency) => {
    setCur(c)
    if (type) setHousehold(householdId ?? "", type, c)
  }

  useEffect(() => {
    onDraftChange(type ? { name: name || defaultName, type, currency: cur } : null)
  }, [name, type, cur, defaultName, onDraftChange])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("setup.step1Title")}</h2>

      <div className="grid grid-cols-2 gap-3">
        <TypeCard
          icon={<Icon icon="lucide:home" className="h-6 w-6" />}
          label={t("setup.personal")}
          selected={type === "personal"}
          onClick={() => handleTypeChange("personal")}
        />
        <TypeCard
          icon={<Icon icon="lucide:users" className="h-6 w-6" />}
          label={t("setup.family")}
          selected={type === "family"}
          onClick={() => handleTypeChange("family")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("setup.currency")}</Label>
        <div className="flex gap-2">
          {(["VND", "USD"] as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleCurrencyChange(c)}
              className={cn(
                "min-h-[44px] flex-1 rounded-xl border text-base font-medium transition-colors",
                cur === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="household-name">{t("setup.householdName")}</Label>
        <Input
          id="household-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("setup.householdNamePlaceholder")}
        />
      </div>
    </div>
  )
}

function TypeCard({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border text-base font-medium transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          selected ? "bg-primary/10" : "bg-secondary"
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}
