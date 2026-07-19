"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@growbase/shared/rules/currency"
import { useEventBudgets } from "@/lib/hooks/useEventBudgets"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { BudgetProgressBar } from "@/components/shared/BudgetProgressBar"
import { EventBudgetForm } from "@/components/event-budgets/EventBudgetForm"
import { EventBudgetDetail } from "@/components/event-budgets/EventBudgetDetail"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { useSortable } from "@/lib/hooks/useSortable"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { EventBudget, EventBudgetStatus } from "@growbase/shared/types/app"

const STATUS_VARIANT: Record<EventBudgetStatus, "default" | "secondary"> = {
  active: "default",
  completed: "secondary",
}

export function EventBudgetClient() {
  const { t } = useTranslation()
  const { data, isLoading } = useEventBudgets()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const budgets = data ?? []
  const { sortedData, sortColumn, sortDirection, onSort } =
    useSortable<EventBudget>(budgets)

  if (selectedId) {
    return <EventBudgetDetail id={selectedId} onBack={() => setSelectedId(null)} />
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <div className="p-4 pb-16">
      <PageHeader
        titleKey="nav.eventBudgets"
        actions={
          <Button
            size="sm"
            onClick={() => setFormOpen(true)}
            className="min-h-[44px] gap-1"
          >
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {t("eventBudget.add")}
          </Button>
        }
      />

      {budgets.length === 0 ? (
        <EmptyState
          icon="lucide:party-popper"
          title={t("eventBudget.title")}
          description={t("eventBudget.empty")}
          ctaLabel={t("eventBudget.add")}
          onCta={() => setFormOpen(true)}
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("eventBudget.name")}</TableHead>
                  <SortableTableHead
                    column="total_budget"
                    sortColumn={sortColumn as string | null}
                    sortDirection={sortDirection}
                    onSort={(c) => onSort(c as keyof EventBudget)}
                    className="text-right"
                  >
                    {t("eventBudget.totalBudget")}
                  </SortableTableHead>
                  <SortableTableHead
                    column="total_actual"
                    sortColumn={sortColumn as string | null}
                    sortDirection={sortDirection}
                    onSort={(c) => onSort(c as keyof EventBudget)}
                    className="text-right"
                  >
                    {t("eventBudget.totalActual")}
                  </SortableTableHead>
                  <TableHead className="text-right">{t("eventBudget.remaining")}</TableHead>
                  <TableHead>{t("eventBudget.eventDate")}</TableHead>
                  <TableHead>{t("eventBudget.status.label")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((b) => {
                  const remaining = b.total_budget - b.total_actual
                  return (
                    <TableRow
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <span className="text-sm font-medium">{b.name}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {formatVND(b.total_budget)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {formatVND(b.total_actual)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-sm tabular-nums",
                          remaining >= 0 ? "text-success" : "text-expense"
                        )}
                      >
                        {formatVND(remaining)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.event_date ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[b.status]} className="text-[10px]">
                          {t(`eventBudget.status.${b.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {budgets.map((budget) => (
              <EventBudgetCard
                key={budget.id}
                budget={budget}
                onSelect={() => setSelectedId(budget.id)}
              />
            ))}
          </div>
        </>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("eventBudget.add")}</SheetTitle>
          </SheetHeader>
          <EventBudgetForm onSuccess={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

type EventBudgetCardProps = {
  budget: EventBudget
  onSelect: () => void
}

function EventBudgetCard({ budget, onSelect }: EventBudgetCardProps) {
  const { t } = useTranslation()
  const remaining = budget.total_budget - budget.total_actual
  const usagePct =
    budget.total_budget > 0 ? (budget.total_actual / budget.total_budget) * 100 : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[13px] border border-border/40 bg-card p-4 text-left shadow-card"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{budget.name}</span>
        <Badge variant={STATUS_VARIANT[budget.status]} className="text-[10px]">
          {t(`eventBudget.status.${budget.status}`)}
        </Badge>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {formatVND(budget.total_actual)}
          </span>
          <span className="font-mono tabular-nums">
            {formatVND(budget.total_budget)}
          </span>
        </div>
        <BudgetProgressBar percentage={usagePct} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("eventBudget.remaining")}</span>
        <span
          className={cn(
            "font-mono font-semibold tabular-nums",
            remaining >= 0 ? "text-success" : "text-expense"
          )}
        >
          {formatVND(remaining)}
        </span>
      </div>
    </button>
  )
}
