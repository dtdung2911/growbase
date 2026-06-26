"use client"

import { useState, useEffect, useMemo } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { BudgetTotalBar } from "@/components/settings/BudgetTotalBar"
import { SystemBudgetRow } from "@/components/settings/SystemBudgetRow"
import { CustomBudgetRow } from "@/components/settings/CustomBudgetRow"
import { AddCustomBaselineForm } from "@/components/settings/AddCustomBaselineForm"
import {
  useBudgetBaselines,
  useBatchUpdateBaselines,
  useDeleteCustomBaseline,
} from "@/lib/hooks/useBudgetBaselines"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { BudgetBaseline } from "@/types/app"

export function BudgetBaselineManager() {
  const { t } = useTranslation()
  const { data: baselines, isLoading } = useBudgetBaselines()
  const batchUpdate = useBatchUpdateBaselines()
  const deleteMutation = useDeleteCustomBaseline()

  const [localPcts, setLocalPcts] = useState<Record<string, number>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BudgetBaseline | null>(null)

  useEffect(() => {
    if (baselines) {
      const pcts: Record<string, number> = {}
      for (const b of baselines) {
        pcts[b.id] = b.budget_pct
      }
      setLocalPcts(pcts)
    }
  }, [baselines])

  const { systemLines, customLines } = useMemo(() => {
    if (!baselines) return { systemLines: [], customLines: [] }
    const sys: BudgetBaseline[] = []
    const custom: BudgetBaseline[] = []
    for (const b of baselines) {
      if (b.is_system || b.is_auto_calculated) {
        sys.push(b)
      } else {
        custom.push(b)
      }
    }
    return { systemLines: sys, customLines: custom }
  }, [baselines])

  const total = useMemo(() => {
    return Object.values(localPcts).reduce((sum, pct) => sum + pct, 0)
  }, [localPcts])

  const hasChanges = useMemo(() => {
    if (!baselines) return false
    return baselines.some((b) => localPcts[b.id] !== b.budget_pct)
  }, [baselines, localPcts])

  const handlePctChange = (id: string, pct: number) => {
    setLocalPcts((prev) => ({ ...prev, [id]: pct }))
  }

  const handleSave = () => {
    if (!baselines) return
    const changed = baselines
      .filter((b) => localPcts[b.id] !== b.budget_pct)
      .map((b) => ({ id: b.id, budget_pct: localPcts[b.id] ?? b.budget_pct }))

    if (changed.length === 0) return
    batchUpdate.mutate({ baselines: changed })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  if (isLoading) {
    return <SkeletonList count={5} />
  }

  if (!baselines || baselines.length === 0) {
    return (
      <EmptyState
        icon="lucide:pie-chart"
        title={t("settings.budget.empty")}
        description={t("settings.budget.emptyDesc")}
      />
    )
  }

  return (
    <>
      <div className="space-y-4">
        <BudgetTotalBar total={total} />

        {systemLines.length > 0 && (
          <div className="rounded-[15px] border border-border bg-card p-3 shadow-panel">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
              {t("settings.budget.systemSection")}
            </h3>
            <div className="divide-y">
              {systemLines.map((b) => (
                <SystemBudgetRow
                  key={b.id}
                  baseline={b}
                  value={localPcts[b.id] ?? b.budget_pct}
                  onChange={(pct) => handlePctChange(b.id, pct)}
                />
              ))}
            </div>
          </div>
        )}

        {customLines.length > 0 && (
          <div className="rounded-[15px] border border-border bg-card p-3 shadow-panel">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
              {t("settings.budget.customSection")}
            </h3>
            <div className="divide-y">
              {customLines.map((b) => (
                <CustomBudgetRow
                  key={b.id}
                  baseline={b}
                  value={localPcts[b.id] ?? b.budget_pct}
                  onChange={(pct) => handlePctChange(b.id, pct)}
                  onEdit={() => {
                    // Edit inline via pct change; no separate edit dialog for now
                  }}
                  onDelete={() => setDeleteTarget(b)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => setShowAddForm(true)}
          >
            <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
            {t("settings.budget.addLine")}
          </Button>

          <Button
            className="flex-1 rounded-xl"
            disabled={!hasChanges || batchUpdate.isPending}
            onClick={handleSave}
          >
            {batchUpdate.isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {batchUpdate.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>

      <AddCustomBaselineForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("settings.budget.deleteTitle")}
        description={t("settings.budget.deleteDesc", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("common.delete")}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
