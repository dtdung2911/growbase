"use client"

import { useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { FundCard } from "@/components/funds/FundCard"
import { ContributeModal } from "@/components/funds/ContributeModal"
import { WithdrawModal } from "@/components/funds/WithdrawModal"
import { FundForm } from "@/components/funds/FundForm"
import { formatVNDCompact } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { FUND_TYPE_CONFIG } from "@/types/app"
import type { Fund, FundType } from "@/types/app"

type FundListProps = {
  funds: Fund[]
}

const FUND_GROUPS: { type: FundType; labelKey: string }[] = [
  { type: "emergency", labelKey: "funds.groupEmergency" },
  { type: "sinking", labelKey: "funds.groupSinking" },
  { type: "goal", labelKey: "funds.groupGoal" },
  { type: "investment", labelKey: "funds.groupInvestment" },
  { type: "freedom", labelKey: "funds.groupFreedom" },
]

export function FundList({ funds }: FundListProps) {
  const { t } = useTranslation()
  const [contributeFund, setContributeFund] = useState<Fund | null>(null)
  const [withdrawFund, setWithdrawFund] = useState<Fund | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const totalBalance = funds.reduce((s, f) => s + f.current_balance, 0)
  const activeFunds = funds.filter((f) => f.is_active).length
  const monthlyTotal = funds
    .filter((f) => f.is_active)
    .reduce((s, f) => s + (f.monthly_contribution ?? 0), 0)

  const grouped = useMemo(
    () =>
      FUND_GROUPS.map((group) => ({
        ...group,
        funds: funds.filter((f) => f.fund_type === group.type),
      })).filter((g) => g.funds.length > 0),
    [funds]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{t("funds.totalFunds")}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="min-h-[44px]"
        >
          <Icon icon="lucide:plus" className="h-4 w-4" />
          {t("funds.createFund")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label={t("funds.totalBalance")}
          value={formatVNDCompact(totalBalance)}
        />
        <SummaryCard
          label={t("funds.activeFunds")}
          value={String(activeFunds)}
        />
        <SummaryCard
          label={t("funds.monthlyTotal")}
          value={formatVNDCompact(monthlyTotal)}
          accent
        />
      </div>

      {funds.length === 0 ? (
        <div className="rounded-[13px] border border-border/40 bg-card py-16 text-center shadow-card">
          <p className="mb-3 text-4xl">🪣</p>
          <p className="font-medium text-ink">{t("funds.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("funds.emptyDesc")}
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-4 min-h-[44px]"
          >
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {t("funds.createFirst")}
          </Button>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.type}>
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: FUND_TYPE_CONFIG[group.type].color }}
            >
              {t(group.labelKey)}
            </p>
            {group.funds.map((fund) => (
              <FundCard
                key={fund.id}
                fund={fund}
                onContribute={setContributeFund}
                onWithdraw={setWithdrawFund}
              />
            ))}
          </div>
        ))
      )}

      <ContributeModal
        fund={contributeFund}
        open={!!contributeFund}
        onClose={() => setContributeFund(null)}
      />
      <WithdrawModal
        fund={withdrawFund}
        open={!!withdrawFund}
        onClose={() => setWithdrawFund(null)}
      />
      <FundForm open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-[13px] border border-border/40 bg-card p-3 text-center shadow-card">
      <p className="mb-1 text-[11px] text-muted-foreground">{label}</p>
      <p
        className={`font-mono text-base font-semibold tabular-nums ${
          accent ? "text-primary" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  )
}
