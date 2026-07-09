"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"
import {
  useInvestmentHoldings,
  useInvestmentDcaPlans,
  useInvestmentPurchases,
} from "@/lib/hooks/useInvestments"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { HoldingForm } from "@/components/investments/HoldingForm"
import { PurchaseForm } from "@/components/investments/PurchaseForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { InvestmentHolding } from "@/types/app"

function profitClass(value: number) {
  return value >= 0 ? "text-income" : "text-expense"
}

export function InvestmentClient() {
  const { t } = useTranslation()
  const holdingsQuery = useInvestmentHoldings()
  const dcaQuery = useInvestmentDcaPlans()
  const [purchaseFilter, setPurchaseFilter] = useState<string>("all")
  const purchasesQuery = useInvestmentPurchases(
    purchaseFilter === "all" ? undefined : purchaseFilter
  )

  const [holdingFormOpen, setHoldingFormOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null)
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false)

  const holdings = holdingsQuery.data ?? []
  const dcaPlans = dcaQuery.data ?? []
  const purchases = purchasesQuery.data ?? []

  const holdingRows = holdings.map((h) => ({
    ...h,
    profit: h.current_value - h.total_invested,
  }))

  const {
    sortedData: sortedHoldings,
    sortColumn: holdingSortColumn,
    sortDirection: holdingSortDirection,
    onSort: onHoldingSort,
  } = useSortable(holdingRows)

  const {
    sortedData: sortedPurchases,
    sortColumn: purchaseSortColumn,
    sortDirection: purchaseSortDirection,
    onSort: onPurchaseSort,
  } = useSortable(purchases)

  if (holdingsQuery.isLoading) {
    return (
      <div className="space-y-3 p-4 pb-16">
        <SkeletonList />
      </div>
    )
  }

  const openAddHolding = () => {
    setEditingHolding(null)
    setHoldingFormOpen(true)
  }
  const openEditHolding = (holding: InvestmentHolding) => {
    setEditingHolding(holding)
    setHoldingFormOpen(true)
  }

  return (
    <div className="p-4 pb-16">
      <PageHeader titleKey="nav.investments" />

      <Tabs defaultValue="holdings">
        <TabsList className="w-full">
          <TabsTrigger value="holdings" className="flex-1 text-xs">
            {t("investment.holdings")}
          </TabsTrigger>
          <TabsTrigger value="dca" className="flex-1 text-xs">
            {t("investment.dcaPlan")}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex-1 text-xs">
            {t("investment.purchases")}
          </TabsTrigger>
        </TabsList>

        {/* Holdings */}
        <TabsContent value="holdings" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddHolding} className="min-h-[44px] gap-1">
              <Icon icon="lucide:plus" className="h-4 w-4" />
              {t("investment.addHolding")}
            </Button>
          </div>

          {holdings.length === 0 ? (
            <EmptyState
              icon="lucide:trending-up"
              title={t("investment.holdings")}
              description={t("investment.emptyHoldings")}
              ctaLabel={t("investment.addHolding")}
              onCta={openAddHolding}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("investment.stockCode")}</TableHead>
                      <SortableTableHead
                        column="weight_pct"
                        sortColumn={holdingSortColumn as string | null}
                        sortDirection={holdingSortDirection}
                        onSort={(c) => onHoldingSort(c as never)}
                        className="text-right"
                      >
                        {t("investment.weight")}
                      </SortableTableHead>
                      <SortableTableHead
                        column="total_invested"
                        sortColumn={holdingSortColumn as string | null}
                        sortDirection={holdingSortDirection}
                        onSort={(c) => onHoldingSort(c as never)}
                        className="text-right"
                      >
                        {t("investment.invested")}
                      </SortableTableHead>
                      <SortableTableHead
                        column="current_value"
                        sortColumn={holdingSortColumn as string | null}
                        sortDirection={holdingSortDirection}
                        onSort={(c) => onHoldingSort(c as never)}
                        className="text-right"
                      >
                        {t("investment.currentValue")}
                      </SortableTableHead>
                      <SortableTableHead
                        column="profit"
                        sortColumn={holdingSortColumn as string | null}
                        sortDirection={holdingSortDirection}
                        onSort={(c) => onHoldingSort(c as never)}
                        className="text-right"
                      >
                        {t("investment.profitLoss")}
                      </SortableTableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHoldings.map((h) => {
                      const pl = h.profit
                      return (
                        <TableRow key={h.id}>
                          <TableCell className="font-semibold">{h.stock_code}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {h.weight_pct}%
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatVND(h.total_invested)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatVND(h.current_value)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono tabular-nums",
                              profitClass(pl)
                            )}
                          >
                            {formatVND(pl)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditHolding(h)}
                            >
                              <Icon icon="lucide:pencil" className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {holdings.map((h) => {
                  const pl = h.current_value - h.total_invested
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => openEditHolding(h)}
                      className="w-full rounded-[13px] border border-border/40 bg-card p-4 text-left shadow-card"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-base font-semibold">{h.stock_code}</span>
                        <Badge variant="secondary" className="font-mono tabular-nums">
                          {h.weight_pct}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("investment.invested")}
                          </p>
                          <p className="font-mono tabular-nums">
                            {formatVND(h.total_invested)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("investment.currentValue")}
                          </p>
                          <p className="font-mono tabular-nums">
                            {formatVND(h.current_value)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                        <span className="text-xs text-muted-foreground">
                          {t("investment.profitLoss")}
                        </span>
                        <span className={cn("font-mono text-sm tabular-nums", profitClass(pl))}>
                          {formatVND(pl)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* DCA Plan */}
        <TabsContent value="dca" className="mt-4 space-y-3">
          {dcaPlans.length === 0 ? (
            <EmptyState
              icon="lucide:target"
              title={t("investment.dcaPlan")}
              description={t("investment.emptyDca")}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("investment.stockCode")}</TableHead>
                      <TableHead className="text-right">{t("investment.targetAllocation")}</TableHead>
                      <TableHead>{t("investment.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dcaPlans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold">{p.stock_code}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {p.target_allocation_pct}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                            {p.is_active ? t("investment.active") : t("investment.inactive")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {dcaPlans.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-[13px] border border-border/40 bg-card p-4 shadow-card"
                  >
                    <div>
                      <p className="text-base font-semibold">{p.stock_code}</p>
                      <Badge
                        variant={p.is_active ? "default" : "secondary"}
                        className="mt-1 text-[10px]"
                      >
                        {p.is_active ? t("investment.active") : t("investment.inactive")}
                      </Badge>
                    </div>
                    <span className="font-mono text-lg tabular-nums">
                      {p.target_allocation_pct}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Purchases */}
        <TabsContent value="purchases" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Select value={purchaseFilter} onValueChange={setPurchaseFilter}>
              <SelectTrigger className="min-h-[44px] max-w-[180px]">
                <SelectValue placeholder={t("investment.allHoldings")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("investment.allHoldings")}</SelectItem>
                {holdings.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.stock_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => setPurchaseFormOpen(true)}
              disabled={holdings.length === 0}
              className="min-h-[44px] gap-1"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" />
              {t("investment.addPurchase")}
            </Button>
          </div>

          {purchases.length === 0 ? (
            <EmptyState
              icon="lucide:receipt"
              title={t("investment.purchases")}
              description={
                holdings.length === 0
                  ? t("investment.noHoldings")
                  : t("investment.emptyPurchases")
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden rounded-[13px] border border-border/40 bg-card shadow-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        column="purchase_month"
                        sortColumn={purchaseSortColumn as string | null}
                        sortDirection={purchaseSortDirection}
                        onSort={(c) => onPurchaseSort(c as never)}
                      >
                        {t("investment.purchaseMonth")}
                      </SortableTableHead>
                      <TableHead>{t("investment.stockCode")}</TableHead>
                      <TableHead className="text-right">{t("investment.price")}</TableHead>
                      <TableHead className="text-right">{t("investment.quantity")}</TableHead>
                      <TableHead className="text-right">{t("investment.fees")}</TableHead>
                      <SortableTableHead
                        column="amount"
                        sortColumn={purchaseSortColumn as string | null}
                        sortDirection={purchaseSortDirection}
                        onSort={(c) => onPurchaseSort(c as never)}
                        className="text-right"
                      >
                        {t("investment.total")}
                      </SortableTableHead>
                      <TableHead className="text-right">{t("investment.return")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPurchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">
                          {p.purchase_month.slice(0, 7)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {p.holding?.stock_code ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatVND(p.price)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {p.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatVND(p.fees)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatVND(p.amount)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono tabular-nums",
                            profitClass(p.monthly_return)
                          )}
                        >
                          {p.monthly_return}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {purchases.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[13px] border border-border/40 bg-card p-4 shadow-card"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-base font-semibold">
                        {p.holding?.stock_code ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.purchase_month.slice(0, 7)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("investment.price")}</p>
                        <p className="font-mono tabular-nums">{formatVND(p.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("investment.quantity")}</p>
                        <p className="font-mono tabular-nums">{p.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("investment.total")}</p>
                        <p className="font-mono tabular-nums">{formatVND(p.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("investment.return")}</p>
                        <p className={cn("font-mono tabular-nums", profitClass(p.monthly_return))}>
                          {p.monthly_return}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <HoldingForm
        holding={editingHolding}
        open={holdingFormOpen}
        onOpenChange={setHoldingFormOpen}
      />
      <PurchaseForm
        holdings={holdings}
        open={purchaseFormOpen}
        onOpenChange={setPurchaseFormOpen}
      />
    </div>
  )
}
