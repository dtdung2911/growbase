"use client"

import { useWizardStore } from "@/lib/stores/wizardStore"
import { useCategories } from "@/lib/hooks/useCategories"
import { useTranslation } from "@/lib/i18n/useTranslation"

export function WizardStep6Categories() {
  const { t } = useTranslation()
  const householdId = useWizardStore((s) => s.householdId)
  const { data: groups, isLoading } = useCategories(householdId ?? "")

  const groupCount = groups?.length ?? 0
  const categoryCount =
    groups?.reduce((sum, g) => sum + g.categories.length, 0) ?? 0

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("setup.step6Title")}</h2>

      {isLoading ? (
        <CategorySkeleton />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("setup.step6Summary", { count: categoryCount, groups: groupCount })}
          </p>

          <div className="space-y-3">
            {groups?.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl bg-card p-4 shadow-soft-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: group.color ?? "#6B7280" }}
                  />
                  <p className="text-sm font-medium">{group.name}</p>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {group.categories.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="rounded-2xl bg-primary/5 p-4 text-sm text-primary">
        {t("setup.step6Note")}
      </div>
    </div>
  )
}

function CategorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl bg-muted"
        />
      ))}
    </div>
  )
}
