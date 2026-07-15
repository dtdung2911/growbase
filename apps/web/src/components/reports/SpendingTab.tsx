"use client"

import { useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@growbase/shared/rules/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { SpendingDonut } from "@/components/shared/SpendingDonut"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  TransactionWithJoins,
  BehaviorType,
  SpendingByBehavior,
} from "@growbase/shared/types/app"
import type { CategoryGroupWithCategories } from "@/lib/hooks/useCategories"

type SpendingTabProps = {
  transactions: TransactionWithJoins[]
  categoryGroups: CategoryGroupWithCategories[]
}

type GroupDetail = {
  groupName: string
  total: number
  percentage: number
}

type GroupedSpending = {
  behaviorType: BehaviorType
  total: number
  percentage: number
  pctOfIncome: number
  details: GroupDetail[]
}

export function SpendingTab({ transactions, categoryGroups }: SpendingTabProps) {
  const { t } = useTranslation()
  const [expandedType, setExpandedType] = useState<string | null>(null)

  const { groups, totalExpense, totalIncome } = useMemo(() => {
    const categoryToGroup = new Map<string, string>()
    for (const group of categoryGroups) {
      for (const cat of group.categories) {
        categoryToGroup.set(cat.id, group.name)
      }
    }

    let income = 0
    let expense = 0
    const byBehavior: Record<string, number> = {}
    const byBehaviorGroup: Record<string, Record<string, number>> = {}

    for (const tx of transactions) {
      if (tx.direction === "in") {
        income += tx.amount
      } else if (!tx.exclude_from_budget_report) {
        expense += tx.amount
        const bt = tx.behavior_type ?? "variable"
        byBehavior[bt] = (byBehavior[bt] ?? 0) + tx.amount

        const groupName = tx.category_id
          ? categoryToGroup.get(tx.category_id) ?? t("common.other")
          : t("common.other")
        if (!byBehaviorGroup[bt]) byBehaviorGroup[bt] = {}
        byBehaviorGroup[bt][groupName] =
          (byBehaviorGroup[bt][groupName] ?? 0) + tx.amount
      }
    }

    const groups: GroupedSpending[] = Object.entries(byBehavior)
      .map(([bt, total]) => {
        const groupTotals = byBehaviorGroup[bt] ?? {}
        const details: GroupDetail[] = Object.entries(groupTotals)
          .map(([groupName, groupTotal]) => ({
            groupName,
            total: groupTotal,
            percentage: total > 0 ? Math.round((groupTotal / total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total)

        return {
          behaviorType: bt as BehaviorType,
          total,
          percentage: expense > 0 ? Math.round((total / expense) * 100) : 0,
          pctOfIncome: income > 0 ? Math.round((total / income) * 100) : 0,
          details,
        }
      })
      .sort((a, b) => b.total - a.total)

    return { groups, totalExpense: expense, totalIncome: income }
  }, [transactions, categoryGroups, t])

  const donutData: SpendingByBehavior[] = useMemo(
    () =>
      groups.map((g) => ({
        behavior_type: g.behaviorType,
        total: g.total,
        percentage: g.percentage,
      })),
    [groups]
  )

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("common.noData")}
      </p>
    )
  }

  const toggle = (bt: string) =>
    setExpandedType((prev) => (prev === bt ? null : bt))

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
      <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
        <SpendingDonut data={donutData} formatAmount={formatVND} />
      </div>

      <div className="hidden overflow-hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reports.costType")}</TableHead>
              <TableHead className="text-right">
                {t("reports.amount")}
              </TableHead>
              <TableHead className="text-right">
                {t("reports.pctOfExpense")}
              </TableHead>
              <TableHead className="text-right">
                {t("reports.pctOfIncome")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <SpendingRows
                key={g.behaviorType}
                group={g}
                expanded={expandedType === g.behaviorType}
                onToggle={() => toggle(g.behaviorType)}
                label={t(`behavior.${g.behaviorType}`)}
              />
            ))}
            <TableRow className="bg-muted/40">
              <TableCell className="font-medium">
                {t("reports.totalExpense")}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums font-medium text-expense">
                {formatVND(totalExpense)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                100%
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {totalIncome > 0
                  ? `${Math.round((totalExpense / totalIncome) * 100)}%`
                  : "—"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {groups.map((g) => (
          <div
            key={g.behaviorType}
            className="overflow-hidden rounded-[13px] border border-border/40 bg-card shadow-card"
          >
            <button
              type="button"
              onClick={() => toggle(g.behaviorType)}
              className="flex w-full items-center justify-between px-4 py-3 min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Icon
                  icon="lucide:chevron-right"
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    expandedType === g.behaviorType && "rotate-90",
                  )}
                />
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {t(`behavior.${g.behaviorType}`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("reports.ofExpense", { pct: g.percentage })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium font-mono tabular-nums">
                  {formatVND(g.total)}
                </p>
                {totalIncome > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("reports.ofIncome", { pct: g.pctOfIncome })}
                  </p>
                )}
              </div>
            </button>

            {expandedType === g.behaviorType && g.details.length > 0 && (
              <div className="border-t border-border/50 px-4 py-2 space-y-1">
                {g.details.map((d) => (
                  <div
                    key={d.groupName}
                    className="flex items-center justify-between py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground truncate mr-2">
                      {d.groupName}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">
                        {d.percentage}%
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatVND(d.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type SpendingRowsProps = {
  group: GroupedSpending
  expanded: boolean
  onToggle: () => void
  label: string
}

function SpendingRows({ group, expanded, onToggle, label }: SpendingRowsProps) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="font-medium">
          <span className="flex items-center gap-2">
            <Icon
              icon="lucide:chevron-right"
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
            />
            {label}
          </span>
        </TableCell>
        <TableCell className="text-right font-mono tabular-nums">
          {formatVND(group.total)}
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {group.percentage}%
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {group.pctOfIncome}%
        </TableCell>
      </TableRow>
      {expanded &&
        group.details.map((d) => (
          <TableRow key={d.groupName} className="bg-muted/20">
            <TableCell className="pl-9 text-muted-foreground">{d.groupName}</TableCell>
            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
              {formatVND(d.total)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">{d.percentage}%</TableCell>
            <TableCell />
          </TableRow>
        ))}
    </>
  )
}
