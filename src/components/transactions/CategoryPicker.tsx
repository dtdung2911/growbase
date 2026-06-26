"use client"

import { useState, useMemo } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useCategories,
  type CategoryGroupWithCategories,
} from "@/lib/hooks/useCategories"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { TransactionDirection } from "@/types/app"

type CategoryPickerProps = {
  householdId: string
  direction: TransactionDirection
  value: string | null
  onChange: (categoryId: string) => void
}

// D3: direction filter via cost_type_code (robust, not string-matching group name)
function filterByDirection(
  groups: CategoryGroupWithCategories[],
  direction: TransactionDirection
) {
  if (direction === "in") {
    return groups.filter((g) => g.cost_type_code === "income")
  }
  return groups.filter((g) => g.cost_type_code !== "income")
}

export function CategoryPicker({
  householdId,
  direction,
  value,
  onChange,
}: CategoryPickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { data: groups = [] } = useCategories(householdId)

  const filtered = useMemo(() => {
    const directionFiltered = filterByDirection(groups, direction)
    if (!search.trim()) return directionFiltered

    const q = search.toLowerCase()
    return directionFiltered
      .map((g) => ({
        ...g,
        categories: g.categories.filter((c) =>
          c.name.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.categories.length > 0)
  }, [groups, direction, search])

  const selectedCategory = useMemo(() => {
    for (const g of groups) {
      const found = g.categories.find((c) => c.id === value)
      if (found) return { group: g.name, category: found }
    }
    return null
  }, [groups, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedCategory ? (
            <span className="truncate">
              {selectedCategory.category.icon ?? ""}{" "}
              {selectedCategory.category.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{t("tx.selectCategory")}</span>
          )}
          <Icon icon="lucide:chevron-down" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Icon icon="lucide:search" className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={t("tx.searchCategory")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-1">
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("tx.noCategoryFound")}
              </p>
            )}
            {filtered.map((group) => (
              <div key={group.id}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group.icon ?? ""} {group.name}
                </div>
                {group.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onChange(cat.id)
                      setOpen(false)
                      setSearch("")
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                      value === cat.id && "bg-accent"
                    )}
                  >
                    <Icon
                      icon="lucide:check"
                      className={cn(
                        "h-4 w-4",
                        value === cat.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>
                      {cat.icon ?? ""} {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
