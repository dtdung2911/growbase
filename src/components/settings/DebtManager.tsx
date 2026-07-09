"use client"

import { useState, useMemo } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MetricCard } from "@/components/shared/MetricCard"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { BudgetProgressBar } from "@/components/shared/BudgetProgressBar"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { DebtCard } from "@/components/settings/DebtCard"
import { DebtForm } from "@/components/settings/DebtForm"
import { PaidOffConfirmDialog } from "@/components/settings/PaidOffConfirmDialog"
import { useDebtEntries } from "@/lib/hooks/useDebtEntries"
import { useIncomeSources } from "@/lib/hooks/useIncomeSources"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import type { DebtEntry } from "@/types/app"

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  paid_off: "bg-income/15 text-income",
  refinanced: "bg-violet/15 text-violet",
}

type SortKey = "remaining_amount" | "monthly_payment" | "interest_rate"

function debtProgress(debt: DebtEntry): number {
  if (debt.total_amount <= 0) return 0
  const paid = debt.total_amount - debt.remaining_amount
  return (paid / debt.total_amount) * 100
}

export function DebtManager() {
  const { t } = useTranslation()
  const { data: debts, isLoading } = useDebtEntries()
  const { data: income } = useIncomeSources()

  const [showForm, setShowForm] = useState(false)
  const [editingDebt, setEditingDebt] = useState<DebtEntry | null>(null)
  const [paidOffTarget, setPaidOffTarget] = useState<DebtEntry | null>(null)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const { activeDebts, paidOffDebts } = useMemo(() => {
    if (!debts) return { activeDebts: [], paidOffDebts: [] }
    const active: DebtEntry[] = []
    const paid: DebtEntry[] = []
    for (const d of debts) {
      if (d.status === "paid_off") paid.push(d)
      else active.push(d)
    }
    return { activeDebts: active, paidOffDebts: paid }
  }, [debts])

  const totals = useMemo(() => {
    const totalOutstanding = activeDebts.reduce((s, d) => s + d.remaining_amount, 0)
    const monthlyTotal = activeDebts.reduce((s, d) => s + d.monthly_payment, 0)
    const monthlyIncome =
      income?.current.reduce((s, src) => s + src.monthly_amount, 0) ?? 0
    const dtiRatio = monthlyIncome > 0 ? (monthlyTotal / monthlyIncome) * 100 : null
    return { totalOutstanding, monthlyTotal, dtiRatio }
  }, [activeDebts, income])

  const sortDebts = (rows: DebtEntry[]): DebtEntry[] => {
    if (!sortKey) return rows
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      return sortDir === "asc" ? av - bv : bv - av
    })
  }

  const handleSort = (key: string) => {
    const k = key as SortKey
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(k)
      setSortDir("desc")
    }
  }

  const openAdd = () => {
    setEditingDebt(null)
    setShowForm(true)
  }

  const openEdit = (debt: DebtEntry) => {
    setEditingDebt(debt)
    setShowForm(true)
  }

  if (isLoading) {
    return <SkeletonList count={3} />
  }

  if (!debts || debts.length === 0) {
    return (
      <>
        <EmptyState
          icon="lucide:credit-card"
          title={t("settings.debt.empty")}
          description={t("settings.debt.emptyDesc")}
          ctaLabel={t("settings.debt.addDebt")}
          onCta={openAdd}
        />
        <DebtForm open={showForm} onOpenChange={setShowForm} />
      </>
    )
  }

  const sortedActive = sortDebts(activeDebts)
  const sortedPaidOff = sortDebts(paidOffDebts)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("settings.debt.title")}</h2>
          <Button size="sm" onClick={openAdd} className="min-h-[44px] gap-1.5">
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {t("settings.debt.addDebt")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            label={t("settings.debt.totalOutstanding")}
            amount={totals.totalOutstanding}
            formatAmount={formatVND}
            icon="lucide:wallet"
          />
          <MetricCard
            label={t("settings.debt.monthlyTotal")}
            amount={totals.monthlyTotal}
            formatAmount={formatVND}
            icon="lucide:calendar-clock"
          />
          {totals.dtiRatio !== null && (
            <MetricCard
              label={t("settings.debt.dtiRatio")}
              amount={totals.dtiRatio}
              formatAmount={(n) => `${n.toFixed(1)}%`}
              icon="lucide:percent"
            />
          )}
        </div>

        <Tabs defaultValue="active">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1 text-xs">
              {t("settings.debt.activeTab")} ({activeDebts.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex-1 text-xs">
              {t("settings.debt.paidOffTab")} ({paidOffDebts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <DebtTable
              debts={sortedActive}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              onEdit={openEdit}
              onPaidOff={setPaidOffTarget}
              showProgress
              showActions
            />
            <div className="space-y-3 md:hidden">
              {sortedActive.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("settings.debt.empty")}
                </p>
              ) : (
                sortedActive.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    onEdit={() => openEdit(d)}
                    onPaidOff={() => setPaidOffTarget(d)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="paid">
            <DebtTable
              debts={sortedPaidOff}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              onEdit={openEdit}
              onPaidOff={setPaidOffTarget}
            />
            <div className="space-y-3 md:hidden">
              {sortedPaidOff.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("settings.debt.empty")}
                </p>
              ) : (
                sortedPaidOff.map((d) => (
                  <DebtCard key={d.id} debt={d} onEdit={() => {}} onPaidOff={() => {}} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DebtForm
        debt={editingDebt}
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingDebt(null)
        }}
      />

      <PaidOffConfirmDialog
        debt={paidOffTarget}
        open={paidOffTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPaidOffTarget(null)
        }}
      />
    </>
  )
}

type DebtTableProps = {
  debts: DebtEntry[]
  sortKey: SortKey | null
  sortDir: "asc" | "desc"
  onSort: (key: string) => void
  onEdit: (debt: DebtEntry) => void
  onPaidOff: (debt: DebtEntry) => void
  showProgress?: boolean
  showActions?: boolean
}

function DebtTable({
  debts,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onPaidOff,
  showProgress = false,
  showActions = false,
}: DebtTableProps) {
  const { t } = useTranslation()

  if (debts.length === 0) {
    return null
  }

  return (
    <div className="hidden overflow-hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("settings.debt.creditor")}</TableHead>
            <TableHead>{t("settings.debt.type.label")}</TableHead>
            <SortableTableHead
              column="remaining_amount"
              sortColumn={sortKey}
              sortDirection={sortDir}
              onSort={onSort}
              className="text-right"
            >
              {t("settings.debt.remaining")}
            </SortableTableHead>
            <SortableTableHead
              column="monthly_payment"
              sortColumn={sortKey}
              sortDirection={sortDir}
              onSort={onSort}
              className="text-right"
            >
              {t("settings.debt.monthlyPayment")}
            </SortableTableHead>
            <SortableTableHead
              column="interest_rate"
              sortColumn={sortKey}
              sortDirection={sortDir}
              onSort={onSort}
              className="text-right"
            >
              {t("settings.debt.interestRate")}
            </SortableTableHead>
            <TableHead>{t("settings.debt.status.label")}</TableHead>
            {showActions && (
              <TableHead className="w-20 text-right">
                {t("settings.debt.actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {debts.map((d) => {
            const progress = debtProgress(d)
            return (
              <TableRow key={d.id}>
                <TableCell>
                  <span className="text-sm font-medium">{d.creditor_name}</span>
                  {showProgress && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <BudgetProgressBar percentage={progress} className="w-24" />
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {t(`settings.debt.type.${d.debt_type}`)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatVND(d.remaining_amount)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatVND(d.monthly_payment)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {d.interest_rate !== null ? `${d.interest_rate}%` : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-normal",
                      STATUS_BADGE_CLASS[d.status]
                    )}
                  >
                    {t(`settings.debt.status.${d.status}`)}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        aria-label={t("settings.debt.edit")}
                        onClick={() => onEdit(d)}
                      >
                        <Icon icon="lucide:pencil" className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-income hover:text-income"
                        aria-label={t("settings.debt.markPaidOff")}
                        onClick={() => onPaidOff(d)}
                      >
                        <Icon icon="lucide:check" className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
