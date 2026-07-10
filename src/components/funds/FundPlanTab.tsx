"use client"

import * as React from "react"
import { addMonths, format } from "date-fns"
import { useLivingPlan } from "@/lib/hooks/useLivingPlan"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { todayVN } from "@/lib/utils/date"
import { formatVND } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/cn"
import { COMPOUND_RATES_YEAR } from "@/lib/constants/budgetTemplate"
import { FUND_TYPE_CONFIG, type Fund, type FundTransaction } from "@/types/app"
import { findFundAllocation, fundGoalChannel, hasContributedInMonth } from "./fundPlan"

// Timeline dài (chia chặng) — nhất quán GoalStep 10.2 / 11.2.
const LONG_TIMELINE_MONTHS = 120
const MONO = "font-mono tabular-nums"

type Span = { value: React.ReactNode; className: string }

// Prose i18n có {{placeholder}}; số/% vào span mono, kênh vào span medium (chuẩn 11.2 PlanDetailSheet).
function Interpolated({ template, spans }: { template: string; spans: Record<string, Span> }) {
  const keys = Object.keys(spans)
  if (keys.length === 0) return <>{template}</>
  const re = new RegExp(`(${keys.map((k) => `\\{\\{${k}\\}\\}`).join("|")})`)
  return (
    <>
      {template.split(re).map((part, i) => {
        const match = /^\{\{(\w+)\}\}$/.exec(part)
        const span = match ? spans[match[1]] : undefined
        return span ? (
          <span key={i} className={span.className}>
            {span.value}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      })}
    </>
  )
}

type FundPlanTabProps = {
  fund: Fund
  history: FundTransaction[]
}

export function FundPlanTab({ fund, history }: FundPlanTabProps) {
  const { t, locale } = useTranslation()
  const { plan, isLoading, isError } = useLivingPlan()

  if (isError)
    return (
      <div className="rounded-[13px] border border-border/40 bg-card p-4 text-sm text-muted-foreground shadow-card">
        {t("funds.plan.loadError")}
      </div>
    )
  if (isLoading || !plan)
    return <div className="h-40 animate-pulse rounded-[13px] border border-border/40 bg-card shadow-card" />

  const alloc = findFundAllocation(plan, fund)
  if (!alloc)
    return (
      <div className="rounded-[13px] border border-border/40 bg-card p-4 text-sm text-muted-foreground shadow-card">
        {t("funds.plan.notInPlan")}
      </div>
    )

  const monthlyAmount = alloc.monthlyAmount
  const timeline = alloc.timelineMonths
  const color = fund.color || FUND_TYPE_CONFIG[fund.fund_type].color

  const target =
    fund.target_amount ?? (fund.fund_type === "emergency" ? plan.emergencyTarget : null)
  const progress = target && target > 0 ? (fund.current_balance / target) * 100 : null
  // Goal chưa đặt target → engine trả timeline 0 (đủ ngay); KHÔNG được mừng "đã đạt", chỉ là chưa đủ dữ liệu.
  const goalTargetMissing =
    fund.fund_type === "goal" && (fund.target_amount === null || fund.target_amount <= 0)
  const showMilestone = timeline !== null && timeline > LONG_TIMELINE_MONTHS

  // 6,5 (vi) vs 6.5 (en); số nguyên giữ nguyên.
  const fmtRate = (rate: number) => {
    const pct = rate * 100
    const s = Number.isInteger(pct) ? String(pct) : pct.toFixed(1)
    return locale === "vi" ? s.replace(".", ",") : s
  }

  const channel = fundGoalChannel(fund, plan)
  const showChannel = channel !== null && channel.compoundMonths !== null

  // "Tháng này" = tháng lịch thực VN (mirror route living-plan, BR-OB-015), KHÔNG phải tháng đang duyệt.
  const contributed = hasContributedInMonth(history, todayVN().slice(0, 7))
  const showDrift = !contributed && timeline !== null && timeline > 0 && monthlyAmount !== null

  const timelineNode = () => {
    if (timeline === null || goalTargetMissing)
      return <span className="text-muted-foreground">{t("funds.plan.timelineUnknown")}</span>
    if (timeline === 0) return <span className="text-foreground">{t("funds.plan.timelineDone")}</span>
    const date = format(addMonths(new Date(), timeline), "MM/yyyy")
    return (
      <Interpolated
        template={t("funds.plan.timelineValue")}
        spans={{ months: { value: timeline, className: MONO }, date: { value: date, className: MONO } }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Khối 1: con đường của quỹ này */}
      <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">{t("funds.plan.monthlyLabel")}</span>
          {monthlyAmount === null || goalTargetMissing ? (
            <span className="text-sm text-muted-foreground">{t("funds.plan.monthlyUnknown")}</span>
          ) : (
            <span className={cn("text-sm font-semibold text-ink", MONO)}>{formatVND(monthlyAmount)}</span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <span className="shrink-0 text-xs text-muted-foreground">{t("funds.plan.timelineLabel")}</span>
          <span className="text-right text-sm">{timelineNode()}</span>
        </div>

        {progress !== null && (
          <div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full [transition:width_300ms_ease]"
                style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
              />
              {showMilestone && (
                <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-foreground/40" aria-hidden />
              )}
            </div>
            {showMilestone && (
              <div className="relative mt-1 h-3">
                <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                  {t("funds.plan.milestoneLabel")}
                </span>
              </div>
            )}
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span className={MONO}>{progress.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Drift: chưa góp tháng này — kể tử tế, KHÔNG như lỗi (BR-OB-017) */}
      {showDrift && (
        <p className="text-xs text-muted-foreground">
          <Interpolated
            template={t("funds.plan.drift")}
            spans={{ suggest: { value: formatVND(monthlyAmount), className: MONO } }}
          />
        </p>
      )}

      {/* Khối 2: kênh gợi ý + lãi kép (goal dài) */}
      {showChannel && channel && (
        <div className="space-y-2 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">{t("setupV2.plan.channelTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("setupV2.plan.channelLead")}</p>
          </div>
          <p className="text-xs text-foreground">
            <Interpolated
              template={t("setupV2.plan.channelLine")}
              spans={{
                channel: { value: t(`setupV2.goal.channel.${channel.tierKey}`), className: "font-medium" },
                rate: { value: fmtRate(channel.annualRate), className: MONO },
                months: { value: channel.compoundMonths, className: MONO },
              }}
            />
          </p>
          <p className="rounded bg-warning/10 px-2 py-1 text-xs text-foreground">
            <Interpolated
              template={t("setupV2.goal.compoundDisclaimer")}
              spans={{ year: { value: COMPOUND_RATES_YEAR, className: MONO } }}
            />
          </p>
        </div>
      )}
    </div>
  )
}
