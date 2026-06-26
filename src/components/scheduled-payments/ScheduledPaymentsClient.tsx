"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"
import { useScheduledPayments } from "@/lib/hooks/useScheduledPayments"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { PaymentCard } from "@/components/scheduled-payments/PaymentCard"
import { ScheduledPaymentForm } from "@/components/scheduled-payments/ScheduledPaymentForm"
import { DueBadge } from "@/components/shared/DueBadge"
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
import type { PaymentStatus } from "@/types/app"

const STATUS_VARIANT: Record<PaymentStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  cancelled: "secondary",
  expired: "destructive",
}

const PERIOD_KEYS: Record<string, string> = {
  monthly: "scheduledPayments.monthly",
  quarterly: "scheduledPayments.quarterly",
  yearly: "scheduledPayments.yearly",
}

export function ScheduledPaymentsClient() {
  const { data, isLoading } = useScheduledPayments()
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("active")

  const allPayments = data ?? []
  const filtered =
    statusFilter === "all"
      ? allPayments
      : allPayments.filter((p) => p.status === statusFilter)

  const { sortedData, sortColumn, sortDirection, onSort } = useSortable(filtered)

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <SkeletonList />
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("scheduledPayments.title")}</h1>
        <Button
          size="sm"
          onClick={() => setFormOpen(true)}
          className="min-h-[44px] gap-1"
        >
          <Icon icon="lucide:plus" className="h-4 w-4" />
          {t("common.add")}
        </Button>
      </div>

      {/* Status filter chips */}
      <div className="mb-3 flex gap-2">
        {(["all", "active", "cancelled", "expired"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {s === "all" ? t("common.all") : t(`scheduledPayments.status.${s}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="lucide:calendar-clock"
          title={t("scheduledPayments.title")}
          description={t("common.noData")}
          ctaLabel={t("scheduledPayments.add")}
          onCta={() => setFormOpen(true)}
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-[15px] border border-border bg-card shadow-panel">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("scheduledPayments.name")}</TableHead>
                  <SortableTableHead
                    column="amount"
                    sortColumn={sortColumn as string | null}
                    sortDirection={sortDirection}
                    onSort={(c) => onSort(c as never)}
                    className="text-right"
                  >
                    {t("tx.amount")}
                  </SortableTableHead>
                  <TableHead>{t("scheduledPayments.period")}</TableHead>
                  <SortableTableHead
                    column="status"
                    sortColumn={sortColumn as string | null}
                    sortDirection={sortDirection}
                    onSort={(c) => onSort(c as never)}
                  >
                    {t("scheduledPayments.status.label")}
                  </SortableTableHead>
                  <SortableTableHead
                    column="next_due_date"
                    sortColumn={sortColumn as string | null}
                    sortDirection={sortDirection}
                    onSort={(c) => onSort(c as never)}
                  >
                    {t("scheduledPayments.nextDue")}
                  </SortableTableHead>
                  <TableHead>{t("scheduledPayments.expiryDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">{p.name}</span>
                        {p.payment_method && (
                          <p className="text-xs text-muted-foreground">
                            {p.payment_method}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono tabular-nums text-sm">
                        {formatVND(p.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {t(PERIOD_KEYS[p.period] ?? "scheduledPayments.monthly")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status]} className="text-[10px]">
                        {t(`scheduledPayments.status.${p.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{p.next_due_date}</span>
                        <DueBadge
                          urgencyLevel={p.urgency_level}
                          daysUntilDue={p.days_until_due}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {p.expiry_date ?? "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        </>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("scheduledPayments.add")}</SheetTitle>
          </SheetHeader>
          <ScheduledPaymentForm onSuccess={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
