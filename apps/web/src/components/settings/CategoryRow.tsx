"use client"

import { Icon } from "@iconify/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { VariantProps } from "class-variance-authority"
import type { badgeVariants } from "@/components/ui/badge"

type CategoryRowProps = {
  category: {
    id: string
    name: string
    icon: string | null
    default_behavior_type: string
  }
  isSystem: boolean
  onEdit: () => void
  onDelete: () => void
}

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const BEHAVIOR_BADGE_VARIANT: Record<string, BadgeVariant> = {
  fixed: "default",
  variable: "success",
  wasteful: "warning",
  debt_repayment: "destructive",
  savings_investment: "violet",
}

export function CategoryRow({
  category,
  isSystem,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const { t } = useTranslation()
  const badgeVariant = BEHAVIOR_BADGE_VARIANT[category.default_behavior_type]
  const behaviorKey = `behavior.${category.default_behavior_type}`

  return (
    <div className="flex min-h-[44px] items-center justify-between gap-2 px-2 py-2">
      <div className="flex items-center gap-2">
        {category.icon && (
          <span className="text-base">{category.icon}</span>
        )}
        <span className="text-sm">{category.name}</span>
        {badgeVariant && (
          <Badge variant={badgeVariant} className="text-[10px] font-normal">
            {t(behaviorKey)}
          </Badge>
        )}
        {isSystem && (
          <Icon icon="lucide:lock" className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      {!isSystem && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={onEdit}
          >
            <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Icon icon="lucide:trash-2" className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
