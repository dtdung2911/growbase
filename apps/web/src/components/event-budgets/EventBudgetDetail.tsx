"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@growbase/shared/rules/currency"
import { useEventBudget } from "@/lib/hooks/useEventBudgets"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { BudgetProgressBar } from "@/components/shared/BudgetProgressBar"
import { EventBudgetItemForm } from "@/components/event-budgets/EventBudgetItemForm"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type EventBudgetDetailProps = {
  id: string
  onBack: () => void
}

export function EventBudgetDetail({ id, onBack }: EventBudgetDetailProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useEventBudget(id)
  const [itemFormOpen, setItemFormOpen] = useState(false)

  if (isLoading || !data) {
    return (
      <div className="space-y-3 p-4">
        <SkeletonList count={4} />
      </div>
    )
  }

  const remaining = data.total_budget - data.total_actual
  const usagePct = data.total_budget > 0 ? (data.total_actual / data.total_budget) * 100 : 0
  const items = data.items ?? []

  return (
    <div className="p-4 pb-16">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="min-h-[44px] gap-1"
        >
          <Icon icon="lucide:chevron-left" className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <Button
          size="sm"
          onClick={() => setItemFormOpen(true)}
          className="min-h-[44px] gap-1"
        >
          <Icon icon="lucide:plus" className="h-4 w-4" />
          {t("eventBudget.addItem")}
        </Button>
      </div>

      <div className="mb-4 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
        <h2 className="text-lg font-semibold">{data.name}</h2>
        {data.event_date && (
          <p className="mt-0.5 text-xs text-muted-foreground">{data.event_date}</p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("eventBudget.totalBudget")}</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
              {formatVND(data.total_budget)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("eventBudget.totalActual")}</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
              {formatVND(data.total_actual)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("eventBudget.remaining")}</p>
            <p
              className={cn(
                "mt-0.5 font-mono text-sm font-semibold tabular-nums",
                remaining >= 0 ? "text-success" : "text-expense"
              )}
            >
              {formatVND(remaining)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("eventBudget.usage")}</span>
            <span className="font-mono tabular-nums">{Math.round(usagePct)}%</span>
          </div>
          <BudgetProgressBar percentage={usagePct} />
        </div>

        {data.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{data.notes}</p>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="lucide:list-checks"
          title={t("eventBudget.items")}
          description={t("eventBudget.noItems")}
          ctaLabel={t("eventBudget.addItem")}
          onCta={() => setItemFormOpen(true)}
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("eventBudget.itemName")}</TableHead>
                  <TableHead className="text-right">{t("eventBudget.planned")}</TableHead>
                  <TableHead className="text-right">{t("eventBudget.actual")}</TableHead>
                  <TableHead className="text-right">{t("eventBudget.difference")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const diff = item.planned_amount - item.actual_amount
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">{item.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {formatVND(item.planned_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {formatVND(item.actual_amount)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-sm tabular-nums",
                          diff >= 0 ? "text-success" : "text-expense"
                        )}
                      >
                        {formatVND(diff)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => {
              const diff = item.planned_amount - item.actual_amount
              return (
                <div
                  key={item.id}
                  className="rounded-[13px] border border-border/40 bg-card p-3 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span
                      className={cn(
                        "font-mono text-xs tabular-nums",
                        diff >= 0 ? "text-success" : "text-expense"
                      )}
                    >
                      {formatVND(diff)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("eventBudget.planned")}:{" "}
                      <span className="font-mono tabular-nums">
                        {formatVND(item.planned_amount)}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {t("eventBudget.actual")}:{" "}
                      <span className="font-mono tabular-nums">
                        {formatVND(item.actual_amount)}
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Sheet open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("eventBudget.addItem")}</SheetTitle>
          </SheetHeader>
          <EventBudgetItemForm
            eventBudgetId={id}
            onSuccess={() => setItemFormOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
