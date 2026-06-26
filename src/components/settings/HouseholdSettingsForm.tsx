"use client"

import { useState, useEffect } from "react"
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
import { SkeletonList } from "@/components/shared/SkeletonList"
import { useAppStore } from "@/lib/stores/appStore"
import { useHousehold } from "@/lib/hooks/useHousehold"
import { useUpdateHousehold } from "@/lib/hooks/useHouseholdSettings"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Currency } from "@/types/app"

export function HouseholdSettingsForm() {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const { data: household, isLoading } = useHousehold(householdId ?? "")
  const updateMutation = useUpdateHousehold()

  const [name, setName] = useState("")
  const [currency, setCurrency] = useState<Currency>("VND")

  useEffect(() => {
    if (household) {
      setName(household.name)
      setCurrency(household.currency)
    }
  }, [household])

  if (isLoading || !household) {
    return <SkeletonList count={3} />
  }

  const isPending = updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    updateMutation.mutate({
      name: name.trim(),
      currency,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="hh-name" className="text-xs">
          {t("settings.household.nameLabel")}
        </Label>
        <Input
          id="hh-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl bg-inset text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t("settings.household.typeLabel")}</Label>
        <p className="text-sm text-muted-foreground">
          {t(`settings.household.type.${household.household_type}`)}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hh-currency" className="text-xs">
          {t("settings.household.currencyLabel")}
        </Label>
        <Select
          value={currency}
          onValueChange={(v) => setCurrency(v as Currency)}
        >
          <SelectTrigger id="hh-currency" className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VND">VND - Viet Nam Dong</SelectItem>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={!name.trim() || isPending}
      >
        {isPending && (
          <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
        )}
        {isPending ? t("common.saving") : t("settings.household.saveChanges")}
      </Button>
    </form>
  )
}
