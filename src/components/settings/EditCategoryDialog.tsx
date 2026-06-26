"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { useUpdateCategory } from "@/lib/hooks/useCategoryMutations"
import { useTranslation } from "@/lib/i18n/useTranslation"

type EditCategoryDialogProps = {
  category: {
    id: string
    name: string
    icon: string | null
    default_behavior_type: string
    is_system: boolean
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("")
  const [isActive, setIsActive] = useState(true)
  const updateMutation = useUpdateCategory()

  useEffect(() => {
    if (category) {
      setName(category.name)
      setIcon(category.icon ?? "")
      setIsActive(true)
    }
  }, [category])

  if (!category) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    updateMutation.mutate(
      {
        id: category.id,
        name: name.trim(),
        icon: icon || undefined,
        is_active: isActive,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("settings.categories.editTitle")}</SheetTitle>
          <SheetDescription>
            {t("settings.categories.editDesc")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-cat-name" className="text-xs">
              {t("settings.categories.categoryName")}
            </Label>
            <Input
              id="edit-cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-cat-icon" className="text-xs">
              {t("settings.categories.iconLabel")}
            </Label>
            <Input
              id="edit-cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t("settings.categories.iconPlaceholder")}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-cat-active" className="text-sm">
              {t("settings.categories.activeLabel")}
            </Label>
            <Switch
              id="edit-cat-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={!name.trim() || updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {updateMutation.isPending ? t("common.saving") : t("settings.categories.saveChanges")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
