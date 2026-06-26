"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { IncomeSourceCard } from "@/components/settings/IncomeSourceCard"
import { IncomeSourceForm } from "@/components/settings/IncomeSourceForm"
import { IncomeHistoryItem } from "@/components/settings/IncomeHistoryItem"
import { useIncomeSources } from "@/lib/hooks/useIncomeSources"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { IncomeSource } from "@/types/app"

export function IncomeManager() {
  const { t } = useTranslation()
  const { data, isLoading } = useIncomeSources()

  const [showForm, setShowForm] = useState(false)
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  if (isLoading) {
    return <SkeletonList count={3} />
  }

  const current = data?.current ?? []
  const history = data?.history ?? []

  if (current.length === 0 && history.length === 0) {
    return (
      <>
        <EmptyState
          icon="lucide:banknote"
          title={t("settings.income.empty")}
          description={t("settings.income.emptyDesc")}
          ctaLabel={t("settings.income.addIncome")}
          onCta={() => setShowForm(true)}
        />
        <IncomeSourceForm
          open={showForm}
          onOpenChange={setShowForm}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("settings.income")}</h2>
          <Button
            size="sm"
            className="min-h-[44px] gap-1.5"
            onClick={() => {
              setEditingSource(null)
              setShowForm(true)
            }}
          >
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {t("settings.income.addIncome")}
          </Button>
        </div>

        {current.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
              {t("settings.income.currentSection", { count: current.length })}
            </h3>
            {current.map((s) => (
              <IncomeSourceCard
                key={s.id}
                source={s}
                onEdit={() => {
                  setEditingSource(s)
                  setShowForm(true)
                }}
              />
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <Separator className="mb-3" />
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="flex min-h-[44px] w-full items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"
            >
              {showHistory ? (
                <Icon icon="lucide:chevron-down" className="h-3.5 w-3.5" />
              ) : (
                <Icon icon="lucide:chevron-right" className="h-3.5 w-3.5" />
              )}
              {t("settings.income.historySection", { count: history.length })}
            </button>
            {showHistory && (
              <div className="mt-2 space-y-1">
                {history.map((s) => (
                  <IncomeHistoryItem key={s.id} source={s} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <IncomeSourceForm
        source={editingSource}
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingSource(null)
        }}
      />
    </>
  )
}
