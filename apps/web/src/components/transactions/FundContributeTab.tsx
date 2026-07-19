"use client"

import { useState } from "react"
import { useFunds } from "@/lib/hooks/useFunds"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContributeForm } from "@/components/funds/ContributeModal"
import { FundForm } from "@/components/funds/FundForm"

// Tab "Nạp quỹ" trong QuickAddSheet (19-5): chọn quỹ → ContributeForm hiện có
// (đã có preview số dư trước/sau). Submit qua useFundContribute — API contribute.
export function FundContributeTab({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { data: funds = [], isLoading } = useFunds()
  const [fundId, setFundId] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  const selected = funds.find((f) => f.id === fundId)

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-[13px] bg-muted" />
  }

  if (funds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">{t("tx.noFundsYet")}</p>
        <Button onClick={() => setCreateOpen(true)}>{t("tx.createFundNew")}</Button>
        <FundForm
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(fund) => setFundId(fund.id)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("tx.selectFund")}</label>
        <div className="flex items-center gap-2">
          <Select value={fundId} onValueChange={setFundId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t("tx.selectFund")} />
            </SelectTrigger>
            <SelectContent>
              {funds.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name} —{" "}
                  <span className="font-mono tabular-nums">
                    {formatVND(f.current_balance)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            {t("tx.createFundNew")}
          </Button>
        </div>
      </div>

      {selected && <ContributeForm fund={selected} onClose={onClose} />}

      <FundForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(fund) => setFundId(fund.id)}
      />
    </div>
  )
}
