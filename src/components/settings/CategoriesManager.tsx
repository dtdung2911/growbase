"use client"

import { useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { InlineNameEditor } from "@/components/settings/InlineNameEditor"
import { InlineAddRow } from "@/components/settings/InlineAddRow"
import { AddCostTypeSheet } from "@/components/settings/AddCostTypeSheet"
import { useCategories } from "@/lib/hooks/useCategories"
import { useCostTypes, useUpdateCostType, useDeleteCostType } from "@/lib/hooks/useCostTypes"
import {
  useCreateCategoryGroup,
  useUpdateCategoryGroup,
  useDeleteCategoryGroup,
} from "@/lib/hooks/useCategoryGroupMutations"
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks/useCategoryMutations"
import { useAppStore } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { CategoryGroupWithCategories } from "@/lib/hooks/useCategories"
import type { CostType } from "@/lib/hooks/useCostTypes"

type CostTypeNode = CostType & {
  groups: CategoryGroupWithCategories[]
}

const BEHAVIOR_BADGE_CLASS: Record<string, string> = {
  fixed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  variable: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  wasteful: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  debt_repayment: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  savings_investment: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  income: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  loan: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
}

function BehaviorBadge({ code }: { code: string | null }) {
  const { t } = useTranslation()
  if (!code) return null
  const cls = BEHAVIOR_BADGE_CLASS[code]
  return (
    <Badge variant="secondary" className={cn("text-[10px] font-normal", cls)}>
      {t(`behavior.${code}`)}
    </Badge>
  )
}

type DeleteTarget =
  | { kind: "costType"; id: string; name: string }
  | { kind: "group"; id: string; name: string }
  | { kind: "category"; id: string; name: string }

export function CategoriesManager() {
  const { t, locale } = useTranslation()
  const householdId = useAppStore((s) => s.householdId) ?? ""

  const { data: groups, isLoading: groupsLoading } = useCategories(householdId)
  const { data: costTypes, isLoading: costTypesLoading } = useCostTypes()

  const updateCostType = useUpdateCostType()
  const deleteCostType = useDeleteCostType()
  const createGroup = useCreateCategoryGroup()
  const updateGroup = useUpdateCategoryGroup()
  const deleteGroup = useDeleteCategoryGroup()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [expandedCostTypes, setExpandedCostTypes] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const [editing, setEditing] = useState<{ kind: string; id: string } | null>(null)
  const [addingGroupTo, setAddingGroupTo] = useState<string | null>(null)
  const [addingCategoryTo, setAddingCategoryTo] = useState<string | null>(null)
  const [addCostTypeOpen, setAddCostTypeOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const tree = useMemo<CostTypeNode[]>(() => {
    if (!costTypes) return []
    const groupsByCostType = new Map<string, CategoryGroupWithCategories[]>()
    for (const g of groups ?? []) {
      if (!g.cost_type_id) continue
      const list = groupsByCostType.get(g.cost_type_id) ?? []
      list.push(g)
      groupsByCostType.set(g.cost_type_id, list)
    }
    return costTypes.map((ct) => ({
      ...ct,
      groups: groupsByCostType.get(ct.id) ?? [],
    }))
  }, [costTypes, groups])

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  const costTypeName = (ct: CostType) =>
    locale === "en" ? ct.display_name : ct.display_name_vi

  if (groupsLoading || costTypesLoading) {
    return <SkeletonList count={6} />
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    const onSuccess = () => setDeleteTarget(null)
    if (deleteTarget.kind === "costType") {
      deleteCostType.mutate(deleteTarget.id, { onSuccess })
    } else if (deleteTarget.kind === "group") {
      deleteGroup.mutate(deleteTarget.id, { onSuccess })
    } else {
      deleteCategory.mutate(deleteTarget.id, { onSuccess })
    }
  }

  const deletePending =
    deleteCostType.isPending || deleteGroup.isPending || deleteCategory.isPending

  const deleteDescKey =
    deleteTarget?.kind === "costType"
      ? "settings.categories.deleteCostTypeDesc"
      : deleteTarget?.kind === "group"
        ? "settings.categories.deleteGroupDesc"
        : "settings.categories.deleteDesc"

  return (
    <>
      {/* Desktop table */}
      <div className="hidden rounded-[15px] border border-border bg-card shadow-panel md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.categories.costType")}</TableHead>
              <TableHead className="w-28">{t("settings.categories.behavior")}</TableHead>
              <TableHead className="w-36 text-right">
                {t("settings.categories.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tree.map((ct) => {
              const ctExpanded = expandedCostTypes.has(ct.id)
              return (
                <CostTypeRows
                  key={ct.id}
                  costType={ct}
                  name={costTypeName(ct)}
                  expanded={ctExpanded}
                  expandedGroups={expandedGroups}
                  editing={editing}
                  addingGroupTo={addingGroupTo}
                  addingCategoryTo={addingCategoryTo}
                  onToggleCostType={() =>
                    toggle(expandedCostTypes, setExpandedCostTypes, ct.id)
                  }
                  onToggleGroup={(gid) => toggle(expandedGroups, setExpandedGroups, gid)}
                  setEditing={setEditing}
                  setAddingGroupTo={setAddingGroupTo}
                  setAddingCategoryTo={setAddingCategoryTo}
                  setDeleteTarget={setDeleteTarget}
                  onSaveCostTypeName={(name) =>
                    updateCostType.mutate(
                      locale === "en"
                        ? { id: ct.id, display_name: name }
                        : { id: ct.id, display_name_vi: name },
                      { onSuccess: () => setEditing(null) }
                    )
                  }
                  onSaveGroupName={(gid, name) =>
                    updateGroup.mutate(
                      { id: gid, name },
                      { onSuccess: () => setEditing(null) }
                    )
                  }
                  onSaveCategoryName={(cid, name) =>
                    updateCategory.mutate(
                      { id: cid, name },
                      { onSuccess: () => setEditing(null) }
                    )
                  }
                  onAddGroup={(name) =>
                    createGroup.mutate(
                      { name, cost_type_id: ct.id },
                      { onSuccess: () => setAddingGroupTo(null) }
                    )
                  }
                  onAddCategory={(gid, name) =>
                    createCategory.mutate(
                      {
                        name,
                        group_id: gid,
                        default_behavior_type: ct.code as never,
                      },
                      { onSuccess: () => setAddingCategoryTo(null) }
                    )
                  }
                  saving={{
                    costType: updateCostType.isPending,
                    group: updateGroup.isPending || createGroup.isPending,
                    category: updateCategory.isPending || createCategory.isPending,
                  }}
                />
              )
            })}
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] text-primary"
                  onClick={() => setAddCostTypeOpen(true)}
                >
                  <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
                  {t("settings.categories.addCostType")}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Mobile accordion */}
      <div className="space-y-3 md:hidden">
        {tree.map((ct) => {
          const ctExpanded = expandedCostTypes.has(ct.id)
          return (
            <div
              key={ct.id}
              className="rounded-[15px] border border-border bg-card shadow-panel"
            >
              <div className="flex min-h-[44px] items-center justify-between p-3">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => toggle(expandedCostTypes, setExpandedCostTypes, ct.id)}
                >
                  <Icon
                    icon={ctExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                    className="h-4 w-4 text-muted-foreground"
                  />
                  <span className="text-sm font-semibold">{costTypeName(ct)}</span>
                  {ct.is_system && (
                    <Icon icon="lucide:lock" className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                {!ct.is_system && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                    onClick={() =>
                      setDeleteTarget({
                        kind: "costType",
                        id: ct.id,
                        name: costTypeName(ct),
                      })
                    }
                  >
                    <Icon icon="lucide:trash-2" className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {ctExpanded && (
                <div className="space-y-2 border-t p-3">
                  {ct.groups.map((g) => {
                    const gExpanded = expandedGroups.has(g.id)
                    return (
                      <div key={g.id} className="rounded-xl bg-inset">
                        <div className="flex min-h-[44px] items-center justify-between px-3">
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-2 py-2 text-left"
                            onClick={() => toggle(expandedGroups, setExpandedGroups, g.id)}
                          >
                            <Icon
                              icon={gExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                              className="h-4 w-4 text-muted-foreground"
                            />
                            <span className="text-sm font-medium">{g.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({g.categories.length})
                            </span>
                          </button>
                          {!g.is_system && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ kind: "group", id: g.id, name: g.name })
                              }
                            >
                              <Icon icon="lucide:trash-2" className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {gExpanded && (
                          <div className="space-y-1 px-3 pb-2">
                            {g.categories.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex min-h-[44px] items-center justify-between gap-2 border-t pt-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{cat.name}</span>
                                  <BehaviorBadge code={cat.default_behavior_type} />
                                </div>
                                {!cat.is_system && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        kind: "category",
                                        id: cat.id,
                                        name: cat.name,
                                      })
                                    }
                                  >
                                    <Icon icon="lucide:trash-2" className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}

                            {addingCategoryTo === g.id ? (
                              <div className="border-t pt-2">
                                <InlineAddRow
                                  placeholder={t("settings.categories.categoryNamePlaceholder")}
                                  isPending={createCategory.isPending}
                                  onSave={(name) =>
                                    createCategory.mutate(
                                      {
                                        name,
                                        group_id: g.id,
                                        default_behavior_type: ct.code as never,
                                      },
                                      { onSuccess: () => setAddingCategoryTo(null) }
                                    )
                                  }
                                  onCancel={() => setAddingCategoryTo(null)}
                                />
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-[44px] w-full justify-start text-xs text-primary"
                                onClick={() => setAddingCategoryTo(g.id)}
                              >
                                <Icon icon="lucide:plus" className="mr-1.5 h-3.5 w-3.5" />
                                {t("settings.categories.addCategory")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {addingGroupTo === ct.id ? (
                    <InlineAddRow
                      placeholder={t("settings.categories.groupNamePlaceholder")}
                      isPending={createGroup.isPending}
                      onSave={(name) =>
                        createGroup.mutate(
                          { name, cost_type_id: ct.id },
                          { onSuccess: () => setAddingGroupTo(null) }
                        )
                      }
                      onCancel={() => setAddingGroupTo(null)}
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] w-full justify-start text-xs text-primary"
                      onClick={() => setAddingGroupTo(ct.id)}
                    >
                      <Icon icon="lucide:plus" className="mr-1.5 h-3.5 w-3.5" />
                      {t("settings.categories.addGroup")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <Button
          variant="outline"
          className="min-h-[44px] w-full rounded-full"
          onClick={() => setAddCostTypeOpen(true)}
        >
          <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
          {t("settings.categories.addCostType")}
        </Button>
      </div>

      <AddCostTypeSheet open={addCostTypeOpen} onOpenChange={setAddCostTypeOpen} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("settings.categories.deleteTitle")}
        description={t(deleteDescKey, { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("common.delete")}
        onConfirm={handleConfirmDelete}
        isPending={deletePending}
      />
    </>
  )
}

type SavingState = { costType: boolean; group: boolean; category: boolean }

type CostTypeRowsProps = {
  costType: CostTypeNode
  name: string
  expanded: boolean
  expandedGroups: Set<string>
  editing: { kind: string; id: string } | null
  addingGroupTo: string | null
  addingCategoryTo: string | null
  onToggleCostType: () => void
  onToggleGroup: (groupId: string) => void
  setEditing: (v: { kind: string; id: string } | null) => void
  setAddingGroupTo: (v: string | null) => void
  setAddingCategoryTo: (v: string | null) => void
  setDeleteTarget: (v: DeleteTarget) => void
  onSaveCostTypeName: (name: string) => void
  onSaveGroupName: (groupId: string, name: string) => void
  onSaveCategoryName: (categoryId: string, name: string) => void
  onAddGroup: (name: string) => void
  onAddCategory: (groupId: string, name: string) => void
  saving: SavingState
}

function CostTypeRows({
  costType,
  name,
  expanded,
  expandedGroups,
  editing,
  addingGroupTo,
  addingCategoryTo,
  onToggleCostType,
  onToggleGroup,
  setEditing,
  setAddingGroupTo,
  setAddingCategoryTo,
  setDeleteTarget,
  onSaveCostTypeName,
  onSaveGroupName,
  onSaveCategoryName,
  onAddGroup,
  onAddCategory,
  saving,
}: CostTypeRowsProps) {
  const { t } = useTranslation()
  const isEditing = editing?.kind === "costType" && editing.id === costType.id

  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/40">
        <TableCell className="font-semibold">
          {isEditing ? (
            <InlineNameEditor
              initialValue={name}
              isPending={saving.costType}
              onSave={onSaveCostTypeName}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={onToggleCostType}
            >
              <Icon
                icon={expanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                className="h-4 w-4 text-muted-foreground"
              />
              <span>{name}</span>
              {costType.is_system && (
                <Icon icon="lucide:lock" className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </TableCell>
        <TableCell>
          <BehaviorBadge code={costType.code} />
        </TableCell>
        <TableCell className="text-right">
          {!isEditing && (
            <div className="flex items-center justify-end gap-1">
              {!costType.is_system && (
                <>
                  <ActionIcon
                    icon="lucide:pencil"
                    onClick={() => setEditing({ kind: "costType", id: costType.id })}
                  />
                  <ActionIcon
                    icon="lucide:trash-2"
                    destructive
                    onClick={() =>
                      setDeleteTarget({ kind: "costType", id: costType.id, name })
                    }
                  />
                </>
              )}
              <ActionIcon
                icon="lucide:plus"
                onClick={() => {
                  if (!expanded) onToggleCostType()
                  setAddingGroupTo(costType.id)
                }}
              />
            </div>
          )}
        </TableCell>
      </TableRow>

      {expanded &&
        costType.groups.map((g) => {
          const gExpanded = expandedGroups.has(g.id)
          const gEditing = editing?.kind === "group" && editing.id === g.id
          return (
            <GroupRows
              key={g.id}
              group={g}
              expanded={gExpanded}
              editing={editing}
              isEditing={gEditing}
              addingCategoryTo={addingCategoryTo}
              saving={saving}
              onToggle={() => onToggleGroup(g.id)}
              setEditing={setEditing}
              setAddingCategoryTo={setAddingCategoryTo}
              setDeleteTarget={setDeleteTarget}
              onSaveGroupName={(value) => onSaveGroupName(g.id, value)}
              onSaveCategoryName={onSaveCategoryName}
              onAddCategory={(value) => onAddCategory(g.id, value)}
            />
          )
        })}

      {expanded && addingGroupTo === costType.id && (
        <TableRow className="hover:bg-transparent">
          <TableCell className="pl-10" colSpan={3}>
            <InlineAddRow
              placeholder={t("settings.categories.groupNamePlaceholder")}
              isPending={saving.group}
              onSave={onAddGroup}
              onCancel={() => setAddingGroupTo(null)}
            />
          </TableCell>
        </TableRow>
      )}

      {expanded && addingGroupTo !== costType.id && (
        <TableRow className="hover:bg-transparent">
          <TableCell className="pl-10" colSpan={3}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => setAddingGroupTo(costType.id)}
            >
              <Icon icon="lucide:plus" className="mr-1.5 h-3.5 w-3.5" />
              {t("settings.categories.addGroup")}
            </Button>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

type GroupRowsProps = {
  group: CategoryGroupWithCategories
  expanded: boolean
  editing: { kind: string; id: string } | null
  isEditing: boolean
  addingCategoryTo: string | null
  saving: SavingState
  onToggle: () => void
  setEditing: (v: { kind: string; id: string } | null) => void
  setAddingCategoryTo: (v: string | null) => void
  setDeleteTarget: (v: DeleteTarget) => void
  onSaveGroupName: (name: string) => void
  onSaveCategoryName: (categoryId: string, name: string) => void
  onAddCategory: (name: string) => void
}

function GroupRows({
  group,
  expanded,
  editing,
  isEditing,
  addingCategoryTo,
  saving,
  onToggle,
  setEditing,
  setAddingCategoryTo,
  setDeleteTarget,
  onSaveGroupName,
  onSaveCategoryName,
  onAddCategory,
}: GroupRowsProps) {
  const { t } = useTranslation()

  return (
    <>
      <TableRow>
        <TableCell className="pl-10 font-medium">
          {isEditing ? (
            <InlineNameEditor
              initialValue={group.name}
              isPending={saving.group}
              onSave={onSaveGroupName}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button type="button" className="flex items-center gap-2" onClick={onToggle}>
              <Icon
                icon={expanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                className="h-4 w-4 text-muted-foreground"
              />
              <span>{group.name}</span>
              <span className="text-xs text-muted-foreground">
                ({group.categories.length})
              </span>
              {group.is_system && (
                <Icon icon="lucide:lock" className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </TableCell>
        <TableCell>
          <BehaviorBadge code={group.cost_type_code} />
        </TableCell>
        <TableCell className="text-right">
          {!isEditing && (
            <div className="flex items-center justify-end gap-1">
              {!group.is_system && (
                <>
                  <ActionIcon
                    icon="lucide:pencil"
                    onClick={() => setEditing({ kind: "group", id: group.id })}
                  />
                  <ActionIcon
                    icon="lucide:trash-2"
                    destructive
                    onClick={() =>
                      setDeleteTarget({ kind: "group", id: group.id, name: group.name })
                    }
                  />
                </>
              )}
              <ActionIcon
                icon="lucide:plus"
                onClick={() => {
                  if (!expanded) onToggle()
                  setAddingCategoryTo(group.id)
                }}
              />
            </div>
          )}
        </TableCell>
      </TableRow>

      {expanded &&
        group.categories.map((cat) => {
          const cEditing = editing?.kind === "category" && editing.id === cat.id
          return (
            <TableRow key={cat.id}>
              <TableCell className="pl-[4.5rem]">
                {cEditing ? (
                  <InlineNameEditor
                    initialValue={cat.name}
                    isPending={saving.category}
                    onSave={(value) => onSaveCategoryName(cat.id, value)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <span>{cat.name}</span>
                )}
              </TableCell>
              <TableCell>
                <BehaviorBadge code={cat.default_behavior_type} />
              </TableCell>
              <TableCell className="text-right">
                {!cEditing && !cat.is_system && (
                  <div className="flex items-center justify-end gap-1">
                    <ActionIcon
                      icon="lucide:pencil"
                      onClick={() => setEditing({ kind: "category", id: cat.id })}
                    />
                    <ActionIcon
                      icon="lucide:trash-2"
                      destructive
                      onClick={() =>
                        setDeleteTarget({
                          kind: "category",
                          id: cat.id,
                          name: cat.name,
                        })
                      }
                    />
                  </div>
                )}
                {!cEditing && cat.is_system && (
                  <Icon
                    icon="lucide:lock"
                    className="ml-auto h-3.5 w-3.5 text-muted-foreground"
                  />
                )}
              </TableCell>
            </TableRow>
          )
        })}

      {expanded && addingCategoryTo === group.id && (
        <TableRow className="hover:bg-transparent">
          <TableCell className="pl-[4.5rem]" colSpan={3}>
            <InlineAddRow
              placeholder={t("settings.categories.categoryNamePlaceholder")}
              isPending={saving.category}
              onSave={onAddCategory}
              onCancel={() => setAddingCategoryTo(null)}
            />
          </TableCell>
        </TableRow>
      )}

      {expanded && addingCategoryTo !== group.id && (
        <TableRow className="hover:bg-transparent">
          <TableCell className="pl-[4.5rem]" colSpan={3}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => setAddingCategoryTo(group.id)}
            >
              <Icon icon="lucide:plus" className="mr-1.5 h-3.5 w-3.5" />
              {t("settings.categories.addCategory")}
            </Button>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function ActionIcon({
  icon,
  destructive,
  onClick,
}: {
  icon: string
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", destructive && "text-destructive hover:text-destructive")}
      onClick={onClick}
    >
      <Icon icon={icon} className="h-4 w-4" />
    </Button>
  )
}
