"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icon } from "@iconify/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppStore } from "@/lib/stores/appStore"
import { useCreateInvite } from "@/lib/hooks/useInvitation"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { inviteSchema, type InviteInput } from "@/lib/validations/household"
import { keys } from "@/lib/queries/queryKeys"

export function InviteMemberForm() {
  const { t } = useTranslation()
  const householdId = useAppStore((s) => s.householdId) ?? ""
  const createInvite = useCreateInvite()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "member", householdId },
  })

  const role = watch("role")

  const close = () => {
    setOpen(false)
    reset({ role: "member", householdId })
  }

  const onSubmit = async (values: InviteInput) => {
    try {
      const result = await createInvite.mutateAsync({ ...values, householdId })
      toast.success(t("settings.members.inviteSent"), {
        description: result.inviteLink,
        action: {
          label: t("common.copy"),
          onClick: () => navigator.clipboard.writeText(result.inviteLink),
        },
        duration: 10000,
      })
      void queryClient.invalidateQueries({ queryKey: keys.members(householdId) })
      void queryClient.invalidateQueries({ queryKey: keys.invitations(householdId) })
      close()
    } catch {
      // error handled by useCreateInvite hook
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Icon icon="lucide:user-plus" className="h-4 w-4" />
        {t("settings.members.invite")}
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("settings.members.invite")}</p>
        <button
          type="button"
          onClick={close}
          className="text-muted-foreground hover:text-foreground"
        >
          <Icon icon="lucide:x" className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-name" className="text-xs">
          {t("settings.members.inviteDisplayName")}
        </Label>
        <Input
          id="invite-name"
          {...register("display_name")}
          placeholder={t("settings.members.inviteNamePlaceholder")}
          className="rounded-xl"
        />
        {errors.display_name && (
          <p className="text-xs text-destructive">{errors.display_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-email" className="text-xs">Email</Label>
        <Input
          id="invite-email"
          type="email"
          {...register("email")}
          placeholder="email@example.com"
          className="rounded-xl"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t("settings.members.roleLabel")}</Label>
        <Select
          value={role}
          onValueChange={(v) => setValue("role", v as "member" | "viewer")}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">{t("settings.members.role.member")}</SelectItem>
            <SelectItem value="viewer">{t("settings.members.role.viewer")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={close}
          className="flex-1"
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={createInvite.isPending}
          className="flex-1 gap-1"
        >
          {createInvite.isPending && (
            <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
          )}
          {t("settings.members.sendInvite")}
        </Button>
      </div>
    </form>
  )
}
