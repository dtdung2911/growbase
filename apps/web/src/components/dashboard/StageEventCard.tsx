"use client"

import { useEffect, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import { useLivingPlan } from "@/lib/hooks/useLivingPlan"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { currentStage } from "@growbase/shared/rules/currentStage"
import { todayVN } from "@growbase/shared/rules/date"
import { cn } from "@/lib/utils/cn"
import {
  detectStageTransition,
  hasUnmetFund,
  monthsToRefill,
  shouldShowDrift,
  type StageTransition,
} from "@growbase/shared/rules/stageEvent"

// 1 card kể 1 chuyện: sự kiện GĐ (lên/xuống) hoặc drift. Sự kiện GĐ ưu tiên hơn drift (không stack).
type EventView =
  | { kind: "event"; transition: StageTransition; months: number | null }
  | { kind: "drift" }

function readStage(key: string): 1 | 2 | 3 | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === "1" || raw === "2" || raw === "3") return Number(raw) as 1 | 2 | 3
    return null
  } catch {
    return null
  }
}

function writeKey(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private mode — bỏ qua, không chặn render
  }
}

// Sự kiện GĐ là câu chuyện cá nhân trên thiết bị (per-device localStorage, KHÔNG notify chéo member —
// BR-OB-018). Ngôn ngữ GĐ mức EVENTS: engine insight GĐ toàn diện là deferred item H.
export function StageEventCard() {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const { plan, emergencyBalance, capacityThisMonth, contributedLastMonth, isLoading, isError } =
    useLivingPlan()

  const [view, setView] = useState<EventView | null>(null)
  const [dismissed, setDismissed] = useState(false)
  // Giải quyết đúng 1 lần khi data sẵn: plan là object tươi mỗi render, không chốt lại thì
  // nhánh drift có thể ghi đè sự kiện GĐ đã hiện ở render kế.
  const resolvedFor = useRef<string | null>(null)

  const emergencyTarget = plan?.emergencyTarget ?? 0

  useEffect(() => {
    if (!householdId || !plan) return
    if (resolvedFor.current === householdId) return
    // Hộ mới / 0 income: chưa có capacity lẫn target → GĐ vô nghĩa, không kể (mirror StageBadge).
    if (capacityThisMonth === 0 && emergencyTarget === 0) return
    resolvedFor.current = householdId

    const current = currentStage(emergencyBalance, emergencyTarget)
    const stageKey = `growbase.last-stage.${householdId}`
    const lastSeen = readStage(stageKey)
    const transition = detectStageTransition(lastSeen, current)
    // Ghi GĐ hiện tại NGAY: sự kiện kể đúng 1 lần (reload không lặp); baseline (lastSeen null) chỉ sync.
    writeKey(stageKey, String(current))

    if (transition) {
      // Còn goal dở? mirror fundPlan: allocation ngoài emergency có timeline chưa đầy (≠ 0).
      const hasIncompleteGoals = plan.allocations.some(
        (a) => a.id !== "emergency" && a.timelineMonths !== 0,
      )
      const months =
        transition.direction === "down"
          ? monthsToRefill({
              toStage: transition.to as 1 | 2,
              emergencyBalance,
              emergencyTarget,
              capacityThisMonth,
              hasIncompleteGoals,
            })
          : null
      setView({ kind: "event", transition, months })
      return
    }

    // Drift nhường sự kiện GĐ; tối đa 1 lần/tháng. Tháng lịch thực VN (khớp route todayVN, tránh
    // double-show quanh giao tháng khi TZ thiết bị lệch — lesson 12.3 P2).
    const month = todayVN().slice(0, 7)
    const driftKey = `growbase.drift-shown.${householdId}.${month}`
    let alreadyShown = false
    try {
      alreadyShown = localStorage.getItem(driftKey) != null
    } catch {
      alreadyShown = false
    }
    if (
      !alreadyShown &&
      shouldShowDrift({ contributedLastMonth, unmetFund: hasUnmetFund(plan) })
    ) {
      writeKey(driftKey, "1")
      setView({ kind: "drift" })
    }
  }, [householdId, plan, emergencyBalance, emergencyTarget, capacityThisMonth, contributedLastMonth])

  if (isLoading || isError || !view || dismissed) return null

  const isDrift = view.kind === "drift"

  return (
    <div
      className={cn(
        "relative rounded-[18px] border p-5 pr-11",
        isDrift ? "border-border/40 bg-card" : "border-primary/30 bg-primary-soft",
      )}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("dashboard.stageEvent.dismiss")}
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Icon icon="lucide:x" className="h-4 w-4" />
      </button>
      <p className={cn("text-sm", isDrift ? "text-muted-foreground" : "text-primary")}>
        {view.kind === "drift" ? (
          t("dashboard.stageEvent.drift")
        ) : view.transition.direction === "up" ? (
          t("dashboard.stageEvent.up", { stage: view.transition.to })
        ) : view.months != null ? (
          <MonthsText template={t("dashboard.stageEvent.down")} months={view.months} />
        ) : (
          t("dashboard.stageEvent.downNoMonths")
        )}
      </p>
    </div>
  )
}

// Tách số tháng ra mono span, giữ prefix/suffix theo ngôn ngữ (mirror StageBadge MonthsLabel).
function MonthsText({ template, months }: { template: string; months: number }) {
  const [prefix, suffix] = template.split("{{months}}")
  return (
    <>
      {prefix}
      <span className="font-mono tabular-nums">{months}</span>
      {suffix ?? ""}
    </>
  )
}
