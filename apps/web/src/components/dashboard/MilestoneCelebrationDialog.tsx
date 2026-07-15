"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { resolveMilestoneCelebration } from "@growbase/shared/rules/goalMilestone"
import type { MilestoneCelebration as Celebration, SeenMilestones } from "@growbase/shared/rules/goalMilestone"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Fund } from "@growbase/shared/types/app"

function readSeen(key: string): SeenMilestones {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as SeenMilestones) : {}
  } catch {
    return {}
  }
}

type MilestoneCelebrationProps = {
  funds: Fund[]
}

export function MilestoneCelebration({ funds }: MilestoneCelebrationProps) {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId)
  const [celebration, setCelebration] = useState<Celebration | null>(null)

  // Key theo householdId (AD-3) — switch household không dính seen của nhà cũ
  const storageKey = `growbase.goal-milestone-seen.${householdId}`

  useEffect(() => {
    if (!householdId) return
    const result = resolveMilestoneCelebration(funds, readSeen(storageKey))
    try {
      // Mark-on-show: persist ngay để reload không hiện lại
      localStorage.setItem(storageKey, JSON.stringify(result.nextSeen))
    } catch {
      // private mode — baseline-init mỗi lần nên không bao giờ celebrate, an toàn
    }
    if (result.celebration) setCelebration(result.celebration)
  }, [funds, householdId, storageKey])

  if (!celebration) return null

  const body =
    celebration.milestone === 100
      ? t("celebration.goalCompletedBody", { goalName: celebration.fundName })
      : t("celebration.milestoneBody", { goalName: celebration.fundName, milestone: celebration.milestone })

  return (
    <Dialog open onOpenChange={(open) => !open && setCelebration(null)}>
      <DialogContent className="max-w-sm rounded-[18px] text-center">
        <div className="animate-bounce text-5xl motion-reduce:animate-none" aria-hidden>
          🎉
        </div>
        <DialogTitle className="text-center text-lg text-ink">
          {t("celebration.milestoneTitle")}
        </DialogTitle>
        <p className="font-mono text-3xl font-semibold tabular-nums text-primary">
          {celebration.milestone}%
        </p>
        <DialogDescription className="text-center text-sm">{body}</DialogDescription>
        <button
          type="button"
          onClick={() => setCelebration(null)}
          className="mx-auto mt-2 flex min-h-[44px] items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:brightness-[0.8]"
        >
          {t("celebration.close")}
        </button>
      </DialogContent>
    </Dialog>
  )
}
