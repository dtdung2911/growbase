"use client"

import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { TableHead } from "@/components/ui/table"

type SortableTableHeadProps = {
  column: string
  sortColumn: string | null
  sortDirection: "asc" | "desc"
  onSort: (column: string) => void
  children: React.ReactNode
  className?: string
}

export function SortableTableHead({
  column,
  sortColumn,
  sortDirection,
  onSort,
  children,
  className,
}: SortableTableHeadProps) {
  const { t } = useTranslation()
  const active = sortColumn === column
  const icon = !active
    ? "lucide:arrow-up-down"
    : sortDirection === "asc"
      ? "lucide:arrow-up"
      : "lucide:arrow-down"

  return (
    <TableHead className={cn("p-0", className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-label={t("common.sortBy", { column: String(children) })}
        className={cn(
          "flex min-h-[36px] w-full items-center gap-1 px-3 transition-colors hover:text-primary",
          className?.includes("text-right") && "justify-end",
          className?.includes("text-center") && "justify-center",
          active && "text-primary"
        )}
      >
        <span>{children}</span>
        <Icon
          icon={icon}
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            active ? "text-primary" : "text-primary/40"
          )}
        />
      </button>
    </TableHead>
  )
}
