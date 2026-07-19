"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useCategories } from "@/lib/hooks/useCategories"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { COST_TYPE_FILTER_CODES } from "@/lib/constants/costTypeBadge"

export type TransactionFilters = {
  categoryId: string | null
  accountId: string | null
  direction: string | null
  costTypeCode: string | null
}

type FilterBarProps = {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
}

const ALL = "__all__"

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId) ?? ""
  const { data: accounts = [] } = useAccounts()
  const { data: groups = [] } = useCategories(householdId)

  const allCategories = groups.flatMap((g) =>
    g.categories.map((c) => ({ id: c.id, name: `${g.name} / ${c.name}` }))
  )

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {/* Direction */}
      <Select
        value={filters.direction ?? ALL}
        onValueChange={(v) =>
          onChange({ ...filters, direction: v === ALL ? null : v })
        }
      >
        <SelectTrigger className="w-[100px] shrink-0">
          <SelectValue placeholder={t("tx.directionFilter")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("tx.all")}</SelectItem>
          <SelectItem value="in">{t("tx.incomeShort")}</SelectItem>
          <SelectItem value="out">{t("tx.expenseShort")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Cost type */}
      <Select
        value={filters.costTypeCode ?? ALL}
        onValueChange={(v) =>
          onChange({ ...filters, costTypeCode: v === ALL ? null : v })
        }
      >
        <SelectTrigger className="w-[140px] shrink-0">
          <SelectValue placeholder={t("tx.costTypeFilter")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("tx.all")}</SelectItem>
          {COST_TYPE_FILTER_CODES.map((code) => (
            <SelectItem key={code} value={code}>
              {t(`behavior.${code}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={filters.categoryId ?? ALL}
        onValueChange={(v) =>
          onChange({ ...filters, categoryId: v === ALL ? null : v })
        }
      >
        <SelectTrigger className="w-[140px] shrink-0">
          <SelectValue placeholder={t("tx.category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("tx.all")}</SelectItem>
          {allCategories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Account */}
      <Select
        value={filters.accountId ?? ALL}
        onValueChange={(v) =>
          onChange({ ...filters, accountId: v === ALL ? null : v })
        }
      >
        <SelectTrigger className="w-[140px] shrink-0">
          <SelectValue placeholder={t("tx.account")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("tx.all")}</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
