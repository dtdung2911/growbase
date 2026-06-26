"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
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
import { useCreateCategory } from "@/lib/hooks/useCategoryMutations"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { BehaviorType } from "@/types/app"

const BEHAVIOR_VALUES: BehaviorType[] = [
  "fixed",
  "variable",
  "wasteful",
  "debt_repayment",
  "savings_investment",
]

type AddCategoryFormProps = {
  groupId: string
  onSuccess: () => void
}

export function AddCategoryForm({ groupId, onSuccess }: AddCategoryFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [behaviorType, setBehaviorType] = useState<BehaviorType>("variable")
  const createMutation = useCreateCategory()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createMutation.mutate(
      {
        name: name.trim(),
        group_id: groupId,
        default_behavior_type: behaviorType,
      },
      {
        onSuccess: () => {
          setName("")
          setBehaviorType("variable")
          onSuccess()
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-inset p-3">
      <div className="space-y-1.5">
        <Label htmlFor="cat-name" className="text-xs">
          {t("settings.categories.categoryName")}
        </Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("settings.categories.categoryNamePlaceholder")}
          className={cn("rounded-xl bg-inset text-base")}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cat-behavior" className="text-xs">
          {t("settings.categories.behaviorType")}
        </Label>
        <Select
          value={behaviorType}
          onValueChange={(v) => setBehaviorType(v as BehaviorType)}
        >
          <SelectTrigger id="cat-behavior" className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BEHAVIOR_VALUES.map((val) => (
              <SelectItem key={val} value={val}>
                {t(`behavior.${val}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSuccess}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="rounded-xl"
          disabled={!name.trim() || createMutation.isPending}
        >
          {createMutation.isPending && (
            <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
          )}
          {createMutation.isPending ? t("common.saving") : t("common.add")}
        </Button>
      </div>
    </form>
  )
}
