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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateCostType } from "@/lib/hooks/useCostTypes"
import { COST_TYPE_CODES, type CostTypeCode } from "@/lib/validations/cost-type"
import { useTranslation } from "@/lib/i18n/useTranslation"

type AddCostTypeSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCostTypeSheet({ open, onOpenChange }: AddCostTypeSheetProps) {
  const { t } = useTranslation()
  const [displayNameVi, setDisplayNameVi] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [code, setCode] = useState<CostTypeCode>("variable")
  const createMutation = useCreateCostType()

  const reset = () => {
    setDisplayNameVi("")
    setDisplayName("")
    setCode("variable")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayNameVi.trim() || !displayName.trim()) return

    createMutation.mutate(
      {
        display_name: displayName.trim(),
        display_name_vi: displayNameVi.trim(),
        code,
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("settings.categories.addCostTypeTitle")}</SheetTitle>
          <SheetDescription>{t("settings.categories.addCostTypeDesc")}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-name-vi" className="text-xs">
              {t("settings.categories.costTypeName")}
            </Label>
            <Input
              id="ct-name-vi"
              value={displayNameVi}
              onChange={(e) => setDisplayNameVi(e.target.value)}
              className="rounded-xl bg-inset text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-name-en" className="text-xs">
              {t("settings.categories.costTypeName")} (EN)
            </Label>
            <Input
              id="ct-name-en"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-code" className="text-xs">
              {t("settings.categories.costTypeCode")}
            </Label>
            <Select value={code} onValueChange={(v) => setCode(v as CostTypeCode)}>
              <SelectTrigger id="ct-code" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_TYPE_CODES.map((val) => (
                  <SelectItem key={val} value={val}>
                    {t(`behavior.${val}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="min-h-[44px] w-full rounded-xl"
            disabled={
              !displayNameVi.trim() ||
              !displayName.trim() ||
              createMutation.isPending
            }
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
