"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateCustomBaseline } from "@/lib/hooks/useBudgetBaselines"
import { useTranslation } from "@/lib/i18n/useTranslation"

type AddCustomBaselineFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCustomBaselineForm({
  open,
  onOpenChange,
}: AddCustomBaselineFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [budgetPct, setBudgetPct] = useState(0)
  const [description, setDescription] = useState("")
  const createMutation = useCreateCustomBaseline()

  const resetForm = () => {
    setName("")
    setBudgetPct(0)
    setDescription("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createMutation.mutate(
      {
        name: name.trim(),
        budget_pct: budgetPct,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          resetForm()
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("settings.budget.addTitle")}</SheetTitle>
          <SheetDescription>
            {t("settings.budget.addDesc")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bl-name" className="text-xs">
              {t("settings.budget.nameLabel")}
            </Label>
            <Input
              id="bl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.budget.namePlaceholder")}
              className="rounded-xl bg-inset text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bl-pct" className="text-xs">
              {t("settings.budget.pctLabel")}
            </Label>
            <Input
              id="bl-pct"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={budgetPct}
              onChange={(e) => setBudgetPct(Number(e.target.value) || 0)}
              className="rounded-xl bg-inset font-mono text-base tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bl-desc" className="text-xs">
              {t("settings.budget.descLabel")}
            </Label>
            <Input
              id="bl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("common.optional")}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {createMutation.isPending ? t("common.saving") : t("common.add")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
