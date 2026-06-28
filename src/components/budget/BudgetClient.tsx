"use client"

import { useState, useMemo } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { useBudgetActuals } from "@/lib/hooks/useBudget"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import {
  BUDGET_TEMPLATE,
  COST_TYPE_GROUP_LABELS,
  type CostTypeGroupKey,
} from "@/lib/constants/budgetTemplate"
import { BudgetOverrideInput } from "@/components/budget/BudgetOverrideInput"
import { BudgetProgressBar } from "@/components/shared/BudgetProgressBar"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { BudgetActualLine } from "@/types/app"

type StatusLevel = "safe" | "monitor" | "warning" | "over"

function getStatus(usagePct: number): StatusLevel {
  if (usagePct >= 100) return "over"
  if (usagePct >= 86) return "warning"
  if (usagePct >= 70) return "monitor"
  return "safe"
}

const STATUS_CONFIG: Record<StatusLevel, { label: string; className: string }> = {
  safe: { label: "budget.status.safe", className: "bg-success/10 text-success" },
  monitor: { label: "budget.status.monitor", className: "bg-info/10 text-info" },
  warning: { label: "budget.status.warning", className: "bg-warning/10 text-warning" },
  over: { label: "budget.status.over", className: "bg-destructive/10 text-destructive" },
}

type GroupedBudget = {
  key: CostTypeGroupKey
  label: string
  goalText: string
  lines: (BudgetActualLine & { goalText?: string })[]
  totalBudget: number
  totalActual: number
  totalRemaining: number
  usagePct: number
  effectivePct: number
}

export function BudgetClient() {
  const { data, isLoading } = useBudgetActuals()
  const { t, locale } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    if (!data?.length) return []

    const lineMap = new Map<string, BudgetActualLine>()
    for (const line of data) {
      lineMap.set(line.cost_type_name, line)
    }

    const groupOrder: CostTypeGroupKey[] = [
      "fixed", "variable", "wasteful", "savings_investment", "debt_repayment", "other",
    ]
    const groups = new Map<CostTypeGroupKey, GroupedBudget>()

    for (const key of groupOrder) {
      const labels = COST_TYPE_GROUP_LABELS[key]
      groups.set(key, {
        key,
        label: locale === "vi" ? labels.vi : labels.en,
        goalText: labels.goalVi,
        lines: [],
        totalBudget: 0,
        totalActual: 0,
        totalRemaining: 0,
        usagePct: 0,
        effectivePct: 0,
      })
    }

    for (const tpl of BUDGET_TEMPLATE) {
      const line = lineMap.get(tpl.name)
      if (!line) continue
      const group = groups.get(tpl.costTypeGroup)
      if (!group) continue
      group.lines.push({ ...line, goalText: tpl.goalText })
      group.totalBudget += line.budget_amount
      group.totalActual += line.actual_amount
      group.effectivePct += line.effective_pct
    }

    const result: GroupedBudget[] = []
    for (const key of groupOrder) {
      const g = groups.get(key)!
      if (g.lines.length === 0) continue
      g.totalRemaining = g.totalBudget - g.totalActual
      g.usagePct = g.totalBudget > 0 ? Math.round((g.totalActual / g.totalBudget) * 100) : 0
      result.push(g)
    }
    return result
  }, [data, locale])

  if (isLoading) {
    return <div className="space-y-4 p-4"><SkeletonList /></div>
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon="lucide:wallet" title={t("budget.title")} description={t("common.noData")} />
      </div>
    )
  }

  const totalBudget = data.reduce((s, l) => s + l.budget_amount, 0)
  const totalActual = data.reduce((s, l) => s + l.actual_amount, 0)
  const totalRemaining = totalBudget - totalActual
  const totalUsage = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0

  return (
    <div className="space-y-4 p-4">
      <PageHeader titleKey="nav.budget" />
      {/* Summary */}
      <div className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">{t("budget.allocated")}</p>
            <p className="text-lg font-semibold font-mono tabular-nums">{formatVND(totalBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("budget.spent")}</p>
            <p className="text-lg font-semibold font-mono tabular-nums text-expense">{formatVND(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("budget.remaining")}</p>
            <p className={cn("text-lg font-semibold font-mono tabular-nums", totalRemaining >= 0 ? "text-income" : "text-expense")}>
              {formatVND(Math.abs(totalRemaining))}
            </p>
          </div>
        </div>
        <BudgetProgressBar percentage={totalUsage} className="mt-3" />
      </div>

      {/* Desktop: grouped table */}
      <div className="hidden md:block rounded-[13px] border border-border/40 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("budget.groupName")}</TableHead>
              <TableHead className="text-center w-[70px]">{t("budget.pct")}</TableHead>
              <TableHead className="text-right">{t("budget.allocated")}</TableHead>
              <TableHead className="text-right">{t("budget.spent")}</TableHead>
              <TableHead className="text-right">{t("budget.remaining")}</TableHead>
              <TableHead className="text-center w-[70px]">{t("budget.usagePercent")}</TableHead>
              <TableHead className="text-center w-[100px]">{t("budget.statusLabel")}</TableHead>
              <TableHead>{t("budget.goal")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((group) => (
              <CostTypeSection
                key={group.key}
                group={group}
                editingId={editingId}
                onEdit={setEditingId}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: accordion */}
      <div className="space-y-3 md:hidden">
        {grouped.map((group) => (
          <MobileCostTypeGroup
            key={group.key}
            group={group}
            editingId={editingId}
            onEdit={setEditingId}
          />
        ))}
      </div>
    </div>
  )
}

function CostTypeSection({
  group,
  editingId,
  onEdit,
}: {
  group: GroupedBudget
  editingId: string | null
  onEdit: (id: string | null) => void
}) {
  const { t } = useTranslation()
  const groupStatus = getStatus(group.usagePct)
  const groupConfig = STATUS_CONFIG[groupStatus]

  return (
    <>
      {/* Cost type header row */}
      <TableRow className="bg-muted/30 font-semibold">
        <TableCell className="text-sm font-bold">{group.label}</TableCell>
        <TableCell className="text-center font-mono tabular-nums text-sm">{group.effectivePct}%</TableCell>
        <TableCell className="text-right font-mono tabular-nums text-sm">{formatVND(group.totalBudget)}</TableCell>
        <TableCell className="text-right font-mono tabular-nums text-sm">{formatVND(group.totalActual)}</TableCell>
        <TableCell className="text-right">
          <span className={cn("font-mono tabular-nums text-sm", group.totalRemaining >= 0 ? "text-income" : "text-expense")}>
            {formatVND(Math.abs(group.totalRemaining))}
          </span>
        </TableCell>
        <TableCell className="text-center font-mono tabular-nums text-sm">{group.usagePct}%</TableCell>
        <TableCell className="text-center">
          <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", groupConfig.className)}>
            {t(groupConfig.label)}
          </span>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground italic">{group.goalText}</TableCell>
      </TableRow>

      {/* Individual budget lines */}
      {group.lines.map((line) => {
        const status = getStatus(line.usage_pct ?? 0)
        const config = STATUS_CONFIG[status]
        const remaining = line.budget_amount - line.actual_amount
        const isEditing = editingId === line.cost_type_id

        return (
          <TableRow key={line.cost_type_id} className="hover:bg-muted/20">
            <TableCell className="pl-8 text-sm">{line.cost_type_name}</TableCell>
            <TableCell className="text-center">
              {isEditing ? (
                <BudgetOverrideInput
                  costTypeId={line.cost_type_id}
                  currentPct={line.effective_pct}
                  hasOverride={line.override_pct !== null}
                  onDone={() => onEdit(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit(line.cost_type_id)}
                  className="text-sm font-mono tabular-nums hover:text-primary transition-colors"
                  title={t("budget.override")}
                >
                  {line.effective_pct}%
                </button>
              )}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums text-sm">{formatVND(line.budget_amount)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums text-sm">{formatVND(line.actual_amount)}</TableCell>
            <TableCell className="text-right">
              <span className={cn("font-mono tabular-nums text-sm", remaining >= 0 ? "text-income" : "text-expense")}>
                {remaining < 0 ? "-" : ""}{formatVND(Math.abs(remaining))}
              </span>
            </TableCell>
            <TableCell className="text-center font-mono tabular-nums text-sm">{Math.round(line.usage_pct ?? 0)}%</TableCell>
            <TableCell className="text-center">
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", config.className)}>
                {t(config.label)}
              </span>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground italic">{line.goalText ?? ""}</TableCell>
          </TableRow>
        )
      })}
    </>
  )
}

function MobileCostTypeGroup({
  group,
  editingId,
  onEdit,
}: {
  group: GroupedBudget
  editingId: string | null
  onEdit: (id: string | null) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const groupStatus = getStatus(group.usagePct)
  const groupConfig = STATUS_CONFIG[groupStatus]

  return (
    <div className="rounded-2xl border border-border bg-card shadow-panel overflow-hidden">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <Icon
            icon="lucide:chevron-right"
            className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")}
          />
          <div>
            <p className="text-sm font-bold">{group.label}</p>
            <p className="text-xs text-muted-foreground">{group.effectivePct}% · {formatVND(group.totalActual)} / {formatVND(group.totalBudget)}</p>
          </div>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", groupConfig.className)}>
          {t(groupConfig.label)}
        </span>
      </button>

      {expanded && (
        <div className="border-t divide-y divide-border/40">
          {group.lines.map((line) => {
            const status = getStatus(line.usage_pct ?? 0)
            const config = STATUS_CONFIG[status]
            const remaining = line.budget_amount - line.actual_amount
            const isEditing = editingId === line.cost_type_id

            return (
              <div key={line.cost_type_id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{line.cost_type_name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", config.className)}>
                    {t(config.label)}
                  </span>
                </div>
                <BudgetProgressBar percentage={line.usage_pct ?? 0} />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t("budget.allocated")}</p>
                    <p className="font-mono tabular-nums">{formatVND(line.budget_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("budget.spent")}</p>
                    <p className="font-mono tabular-nums">{formatVND(line.actual_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("budget.remaining")}</p>
                    <p className={cn("font-mono tabular-nums", remaining >= 0 ? "text-income" : "text-expense")}>
                      {formatVND(Math.abs(remaining))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {line.effective_pct}%
                    {line.override_pct !== null && <span className="ml-1 text-primary">({t("budget.adjusted")})</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(isEditing ? null : line.cost_type_id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary"
                  >
                    <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isEditing && (
                  <BudgetOverrideInput
                    costTypeId={line.cost_type_id}
                    currentPct={line.effective_pct}
                    hasOverride={line.override_pct !== null}
                    onDone={() => onEdit(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
