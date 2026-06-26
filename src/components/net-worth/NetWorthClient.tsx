"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Icon } from "@iconify/react"
import { useNetWorthSnapshot, useNetWorthHistory, useUpsertNetWorth } from "@/lib/hooks/useNetWorth"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { firstDayOfMonth } from "@/lib/utils/date"
import { formatVND } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/cn"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { NetWorthHero } from "@/components/net-worth/NetWorthHero"
import { NetWorthDiscrepancyBanner } from "@/components/net-worth/NetWorthDiscrepancyBanner"
import { NetWorthAccountRow } from "@/components/net-worth/NetWorthAccountRow"
import { NetWorthAccountsTable, type NetWorthAccountRowData } from "@/components/net-worth/NetWorthAccountsTable"
import { NetWorthFundsTable, type NetWorthFundRowData } from "@/components/net-worth/NetWorthFundsTable"
import { NetWorthChart } from "@/components/net-worth/NetWorthChart"
import { NetWorthHistoryTable } from "@/components/net-worth/NetWorthHistoryTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FUND_TYPE_CONFIG, type FundType, type SystemBalance } from "@/types/app"

export function NetWorthClient() {
  const { data, isLoading } = useNetWorthSnapshot()
  const historyQuery = useNetWorthHistory()
  const upsert = useUpsertNetWorth()
  const month = useAppStore((s) => s.currentMonth)
  const { t, locale } = useTranslation()

  const existingItems = useMemo(() => {
    if (!data?.snapshot?.items) return {}
    const items = data.snapshot.items as Array<{ account_id: string; balance_recorded: number }>
    const map: Record<string, number> = {}
    for (const item of items) {
      map[item.account_id] = item.balance_recorded
    }
    return map
  }, [data?.snapshot])

  const [balances, setBalances] = useState<Record<string, number>>({})

  const effectiveBalances = useMemo(() => {
    const merged: Record<string, number> = { ...existingItems }
    for (const [key, val] of Object.entries(balances)) {
      merged[key] = val
    }
    return merged
  }, [existingItems, balances])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 pb-16">
        <SkeletonList />
      </div>
    )
  }

  const systemBalances: SystemBalance[] = (data?.systemBalances ?? []) as SystemBalance[]
  const funds = data?.funds ?? []

  const fundsTotal = funds.reduce((sum, f) => sum + f.current_balance, 0)
  const totalSystem =
    systemBalances.reduce((sum, b) => sum + b.system_balance, 0) + fundsTotal
  const totalRecorded =
    Object.values(effectiveBalances).reduce((sum, v) => sum + v, 0) + fundsTotal
  const discrepancy = totalRecorded - totalSystem

  const changedCount = systemBalances.reduce((count, sb) => {
    const recorded = effectiveBalances[sb.account_id] ?? 0
    const saved = existingItems[sb.account_id] ?? 0
    return recorded !== saved ? count + 1 : count
  }, 0)

  const history = historyQuery.data ?? []
  const delta =
    history.length >= 2
      ? history[history.length - 1].total_recorded - history[history.length - 2].total_recorded
      : null

  const snapshotCreatedAt =
    typeof data?.snapshot?.created_at === "string" ? data.snapshot.created_at : null
  const updatedAt = snapshotCreatedAt ? format(new Date(snapshotCreatedAt), "dd/MM/yyyy") : null

  const accountRows: NetWorthAccountRowData[] = systemBalances.map((sb) => {
    const recorded = effectiveBalances[sb.account_id] ?? 0
    return {
      account_id: sb.account_id,
      account_name: sb.account_name,
      account_type: sb.account_type,
      system_balance: sb.system_balance,
      recorded_balance: recorded,
      difference: recorded - sb.system_balance,
    }
  })

  const fundRows: NetWorthFundRowData[] = funds.map((f) => ({
    id: f.id,
    name: f.name,
    fund_type: f.fund_type,
    current_balance: f.current_balance,
  }))

  const handleBalanceChange = (accountId: string, value: number) => {
    setBalances((prev) => ({ ...prev, [accountId]: value }))
  }

  const handleSave = () => {
    const items = systemBalances.map((sb) => ({
      account_id: sb.account_id,
      balance_recorded: effectiveBalances[sb.account_id] ?? 0,
    }))
    upsert.mutate({
      snapshot_month: firstDayOfMonth(month),
      items,
      total_recorded: totalRecorded,
      total_system: totalSystem,
      notes: null,
    })
  }

  return (
    <div className="space-y-4 p-4 pb-16">
      <Tabs defaultValue="current">
        <TabsList className="w-full">
          <TabsTrigger value="current" className="flex-1 text-xs">{t("netWorth.title")}</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs">{t("netWorth.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4 space-y-4">
          <NetWorthHero total={totalRecorded} delta={delta} updatedAt={updatedAt} />

          {discrepancy !== 0 && (
            <NetWorthDiscrepancyBanner
              totalSystem={totalSystem}
              totalRecorded={totalRecorded}
              discrepancy={discrepancy}
            />
          )}

          <div className="hidden rounded-2xl border border-border/40 bg-card shadow-card md:block">
            <NetWorthAccountsTable rows={accountRows} onBalanceChange={handleBalanceChange} />
          </div>
          <div className="space-y-2 md:hidden">
            {systemBalances.map((sb) => (
              <NetWorthAccountRow
                key={sb.account_id}
                accountName={sb.account_name}
                accountType={sb.account_type}
                systemBalance={sb.system_balance}
                recordedBalance={effectiveBalances[sb.account_id] ?? 0}
                onBalanceChange={(val) => handleBalanceChange(sb.account_id, val)}
              />
            ))}
          </div>

          {funds.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("dashboard.funds")}
              </h3>
              <div className="hidden rounded-2xl border border-border/40 bg-card shadow-card md:block">
                <NetWorthFundsTable rows={fundRows} />
              </div>
              <div className="space-y-2 md:hidden">
                {funds.map((f) => {
                  const config = FUND_TYPE_CONFIG[f.fund_type as FundType]
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-[15px] border border-border bg-card px-4 py-3 shadow-panel"
                    >
                      <div className="flex items-center gap-2">
                        {config && <Icon icon={config.icon} className="h-4 w-4" style={{ color: config.color }} />}
                        <span className="text-sm">{f.name}</span>
                      </div>
                      <span className="font-mono text-sm tabular-nums">{formatVND(f.current_balance)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={upsert.isPending}
            size="lg"
            className={cn("w-full min-h-[44px] text-base")}
          >
            {upsert.isPending ? (
              <Icon icon="lucide:loader-2" className="h-5 w-5 animate-spin" />
            ) : changedCount > 0 ? (
              t("netWorth.saveChanges", { count: changedCount })
            ) : (
              t("netWorth.saveSnapshot")
            )}
          </Button>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <NetWorthChart data={history} isLoading={historyQuery.isLoading} />

          {history.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("netWorth.monthlyHistory")}
              </h3>
              <div className="rounded-2xl border border-border/40 bg-card shadow-card">
                <NetWorthHistoryTable data={history} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
