"use client"

import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"

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

const BEHAVIOR_BADGE_CLASS: Record<string, string> = {
  fixed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  variable: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  wasteful: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  debt_repayment: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  savings_investment: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
}

export function CategoryRow({
  category,
  isSystem,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const { t } = useTranslation()
  const badgeClass = BEHAVIOR_BADGE_CLASS[category.default_behavior_type]
  const behaviorKey = `behavior.${category.default_behavior_type}`

  return (
    <div className="flex min-h-[44px] items-center justify-between gap-2 px-2 py-2">
      <div className="flex items-center gap-2">
        {category.icon && (
          <span className="text-base">{category.icon}</span>
        )}
        <span className="text-sm">{category.name}</span>
        {badgeClass && (
          <Badge
            variant="secondary"
            className={cn("text-[10px] font-normal", badgeClass)}
          >
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
