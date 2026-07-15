"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore, type HouseholdSummary } from "@/lib/stores/appStore"
import { useTranslation } from "@/lib/i18n/useTranslation"

const createSchema = z.object({
  name: z.string().min(1).max(60),
})
type CreateForm = z.infer<typeof createSchema>

export function HouseholdSwitcher() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)
  const allHouseholds = useAppStore((s) => s.allHouseholds)
  const setHouseholdId = useAppStore((s) => s.setHouseholdId)
  const setAllHouseholds = useAppStore((s) => s.setAllHouseholds)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const current = allHouseholds.find((h) => h.id === householdId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  const handleSwitch = (h: HouseholdSummary) => {
    if (h.id === householdId) return
    setHouseholdId(h.id)
    queryClient.invalidateQueries()
  }

  const onCreateSubmit = async (values: CreateForm) => {
    setCreating(true)
    try {
      const res = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err?.error ?? t("common.error"), { duration: 5000 })
        return
      }
      const { data: household } = await res.json()
      const newEntry: HouseholdSummary = { id: household.id, name: household.name, role: "owner" }
      setAllHouseholds([...allHouseholds, newEntry])
      setHouseholdId(household.id)
      queryClient.invalidateQueries()
      toast.success(t("workspace.createSuccess"), { duration: 2000 })
      setCreateOpen(false)
      reset()
    } finally {
      setCreating(false)
    }
  }

  if (allHouseholds.length === 0) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none motion-reduce:transition-none">
            <Icon icon="lucide:building-2" className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="max-w-[140px] truncate">{current?.name ?? "—"}</span>
            {allHouseholds.length > 1 && (
              <Icon icon="lucide:chevrons-up-down" className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("workspace.myWorkspaces")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {allHouseholds.map((h) => (
            <DropdownMenuItem
              key={h.id}
              onClick={() => handleSwitch(h)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Icon
                icon="lucide:check"
                className={`h-3.5 w-3.5 shrink-0 ${h.id === householdId ? "text-primary" : "opacity-0"}`}
              />
              <span className="flex-1 truncate">{h.name}</span>
              {h.role === "member" && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {t("workspace.member")}
                </span>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 cursor-pointer text-primary"
          >
            <Icon icon="lucide:plus" className="h-3.5 w-3.5 shrink-0" />
            {t("workspace.createNew")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("workspace.createTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">{t("workspace.namePlaceholder")}</Label>
              <Input
                id="ws-name"
                placeholder={t("workspace.namePlaceholder")}
                {...register("name")}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setCreateOpen(false); reset() }}
                disabled={creating}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && (
                  <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
