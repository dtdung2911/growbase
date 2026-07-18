"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import { cn } from "@/lib/utils/cn"
import {
  BUDGET_SEGMENTS,
  COMPOUND_RATES_YEAR,
  MAX_ALLOCATION_MONTHS,
  ladderWeights,
  type AllocationPlan,
} from "@growbase/shared/constants/budgetTemplate"
import type { OnboardingFundResult } from "@/lib/hooks/useCompleteOnboardingV2"
import { planGoalChannels } from "./planDetail"

interface PlanDetailSheetProps {
  plan: AllocationPlan
  funds: OnboardingFundResult[]
  monthlyIncome: number
}

type Span = { value: React.ReactNode; className: string }

// Prose i18n có {{placeholder}}; số/% vào span mono, kênh vào span medium (chuẩn 10.3/11.2).
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

function SectionHead({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{lead}</p>
    </div>
  )
}

const MONO = "font-mono tabular-nums"

export function PlanDetailSheet({ plan, funds, monthlyIncome }: PlanDetailSheetProps) {
  const { t, locale } = useTranslation()

  const goalFunds = funds.filter((f) => f.fundType === "goal")
  const weights = ladderWeights(goalFunds.length)
  const channels = planGoalChannels(plan, new Map(goalFunds.map((f) => [f.id, f.targetAmount!])))
  const anyCompound = channels.some((c) => c.compoundMonths !== null)

  const allocById = new Map(plan.allocations.map((a) => [a.id, a]))
  const emergencyTimeline = allocById.get("emergency")?.timelineMonths ?? null
  // Phần tử cuối = 100 − tổng phần trước: round bậc thang có thể lệch (5 goal → 60/30/3/3/3=99).
  const pcts = weights.map((w) => Math.round(w * 100))
  if (pcts.length > 0) pcts[pcts.length - 1] = 100 - pcts.slice(0, -1).reduce((s, p) => s + p, 0)

  // 6,5 (vi) vs 6.5 (en); số nguyên giữ nguyên
  const fmtRate = (rate: number) => {
    const pct = rate * 100
    const s = Number.isInteger(pct) ? String(pct) : pct.toFixed(1)
    return locale === "vi" ? s.replace(".", ",") : s
  }

  // Timeline hoàn thành mỗi quỹ (AC "timeline từng quỹ"): reuse key thời lượng Tada; 0 = đã đạt.
  const timelineNode = (months: number | null) => {
    if (months === null) {
      return <Interpolated template={t("setupV2.tada.fundTimelineNever")} spans={{ max: { value: MAX_ALLOCATION_MONTHS, className: MONO } }} />
    }
    if (months === 0) return t("setupV2.plan.stageMilestoneReached")
    return <Interpolated template={t("setupV2.tada.fundTimeline")} spans={{ months: { value: months, className: MONO } }} />
  }

  const milestoneNode = (month: number | null) => {
    if (month === null) {
      return <Interpolated template={t("setupV2.plan.stageMilestoneFar")} spans={{ max: { value: MAX_ALLOCATION_MONTHS, className: MONO } }} />
    }
    if (month === 0) return t("setupV2.plan.stageMilestoneReached")
    return <Interpolated template={t("setupV2.plan.stageMilestone")} spans={{ months: { value: month, className: MONO } }} />
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="min-h-[44px] w-full">
          {t("setupV2.plan.trigger")}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>{t("setupV2.plan.title")}</SheetTitle>
          <SheetDescription>{t("setupV2.plan.subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* (a) Ngân sách % */}
          <section className="space-y-3">
            <SectionHead title={t("setupV2.plan.budgetTitle")} lead={t("setupV2.plan.budgetLead")} />
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {BUDGET_SEGMENTS.map((s) => (
                <div key={s.key} className={s.color} style={{ width: `${s.pct}%` }} />
              ))}
            </div>
            <ul className="space-y-1.5">
              {BUDGET_SEGMENTS.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-sm">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", s.color)} />
                  <span className="text-muted-foreground">{t(`setupV2.tada.budgetLegend.${s.key}`)}</span>
                  <span className={cn("ml-auto text-foreground", MONO)}>
                    {s.pct}% ·{" "}
                    {t("setupV2.tada.perMonth", { amount: formatVND(Math.round((monthlyIncome * s.pct) / 100)) })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              <Interpolated template={t("setupV2.plan.capacityNote")} spans={{ amount: { value: formatVND(plan.capacityMonthly), className: MONO } }} />
            </p>
          </section>

          {/* (b) Tỷ trọng theo hạng */}
          <section className="space-y-3">
            <SectionHead title={t("setupV2.plan.weightTitle")} lead={t("setupV2.plan.weightLead")} />
            <div className="space-y-1 rounded-[13px] border border-primary/40 bg-primary/5 p-3">
              <p className="text-xs text-foreground">{t("setupV2.plan.emergencyFirst")}</p>
              <div className="text-xs text-muted-foreground">{timelineNode(emergencyTimeline)}</div>
            </div>
            {goalFunds.length > 0 && (
              <ul className="space-y-2">
                {goalFunds.map((f, i) => {
                  const rank = i + 1
                  const rankColor =
                    rank === 1
                      ? "bg-primary/10 text-primary"
                      : rank === 2
                        ? "bg-info/10 text-info"
                        : "bg-muted text-muted-foreground"
                  return (
                    <li
                      key={f.id}
                      className="flex items-center gap-2.5 rounded-[13px] border border-border/40 bg-card p-3 shadow-card"
                    >
                      <span className={cn("flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold", rankColor)}>
                        {t("setupV2.goal.rankLabel", { rank })}
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate font-medium text-foreground">{f.name}</p>
                        <div className="text-xs text-muted-foreground">{timelineNode(allocById.get(f.id)?.timelineMonths ?? null)}</div>
                      </div>
                      <span className={cn("shrink-0 text-sm text-foreground", MONO)}>{pcts[i]}%</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* (c) Ba giai đoạn */}
          <section className="space-y-3">
            <SectionHead title={t("setupV2.plan.stageTitle")} lead={t("setupV2.plan.stageLead")} />
            <ol className="space-y-2">
              <StageRow label={t("setupV2.plan.stage1")} milestone={milestoneNode(plan.stage1EndMonth)} />
              <StageRow label={t("setupV2.plan.stage2")} milestone={milestoneNode(plan.stage2EndMonth)} />
              <StageRow label={t("setupV2.plan.stage3")} milestone={t("setupV2.plan.stage3Note")} />
            </ol>
          </section>

          {/* (d) Kênh gợi ý quỹ dài hạn */}
          {channels.length > 0 && (
            <section className="space-y-3">
              <SectionHead title={t("setupV2.plan.channelTitle")} lead={t("setupV2.plan.channelLead")} />
              {channels.map((c) => {
                const name = goalFunds.find((f) => f.id === c.id)?.name ?? ""
                return (
                  <div key={c.id} className="space-y-1 rounded-[13px] border border-border/40 bg-card p-3 shadow-card">
                    <p className="font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.baseline === null ? (
                        <Interpolated template={t("setupV2.plan.channelBaselineFar")} spans={{ max: { value: MAX_ALLOCATION_MONTHS, className: MONO } }} />
                      ) : (
                        <Interpolated template={t("setupV2.plan.channelBaseline")} spans={{ months: { value: c.baseline, className: MONO } }} />
                      )}
                    </p>
                    {c.compoundMonths !== null && (
                      <p className="text-xs text-foreground">
                        <Interpolated
                          template={t("setupV2.plan.channelLine")}
                          spans={{
                            channel: { value: t(`setupV2.goal.channel.${c.tierKey}`), className: "font-medium" },
                            rate: { value: fmtRate(c.annualRate), className: MONO },
                            months: { value: c.compoundMonths, className: MONO },
                          }}
                        />
                      </p>
                    )}
                  </div>
                )
              })}
              {anyCompound && (
                <p className="rounded bg-warning/10 px-2 py-1 text-xs text-foreground">
                  <Interpolated template={t("setupV2.goal.compoundDisclaimer")} spans={{ year: { value: COMPOUND_RATES_YEAR, className: MONO } }} />
                </p>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StageRow({ label, milestone }: { label: string; milestone: React.ReactNode }) {
  return (
    <li className="rounded-[13px] border border-border/40 bg-card p-3 shadow-card">
      <p className="text-sm text-foreground">{label}</p>
      <div className="mt-1 text-xs text-muted-foreground">{milestone}</div>
    </li>
  )
}
