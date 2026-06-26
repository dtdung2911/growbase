"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Icon } from "@iconify/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateInvite } from "@/lib/hooks/useInvitation"
import { useWizardStore } from "@/lib/stores/wizardStore"
import { inviteSchema } from "@/lib/validations/household"
import { useTranslation } from "@/lib/i18n/useTranslation"

type PendingInvite = {
  email: string
  displayName: string
  inviteLink: string
}

const inviteFormSchema = inviteSchema.omit({ householdId: true })
type InviteFormInput = z.infer<typeof inviteFormSchema>

export function WizardStep2Invite() {
  const { t } = useTranslation()
  const createInvite = useCreateInvite()
  const householdId = useWizardStore((s) => s.householdId)
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormInput>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { role: "member" },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!householdId) {
      toast.error(t("setup.noHousehold"), { duration: 5000 })
      return
    }
    const result = await createInvite.mutateAsync({ ...values, householdId })
    setInvites((prev) => [
      ...prev,
      {
        email: values.email,
        displayName: values.display_name,
        inviteLink: result.inviteLink,
      },
    ])
    toast.success(t("setup.inviteCreated"), { duration: 2000 })
    reset({ email: "", display_name: "", role: "member" })
  })

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link)
    setCopiedLink(link)
    toast.success(t("setup.linkCopied"), { duration: 2000 })
    setTimeout(() => setCopiedLink(null), 2000)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {t("setup.step2Title")}
      </h2>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="invite-name">{t("setup.inviteDisplayName")}</Label>
          <Input
            id="invite-name"
            {...register("display_name")}
            placeholder={t("setup.inviteDisplayNamePlaceholder")}
          />
          {errors.display_name && (
            <p className="text-xs text-rose-400">{errors.display_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-email">{t("setup.inviteEmail")}</Label>
          <Input id="invite-email" type="email" {...register("email")} placeholder="email@example.com" />
          {errors.email && (
            <p className="text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" variant="outline" disabled={createInvite.isPending}>
          {createInvite.isPending && <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />}
          {t("setup.addMember")}
        </Button>
      </form>

      {invites.length > 0 && (
        <ul className="space-y-2">
          {invites.map((inv) => (
            <li
              key={inv.inviteLink}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft-xs"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                {inv.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{inv.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{inv.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => copyLink(inv.inviteLink)}
              >
                {copiedLink === inv.inviteLink ? (
                  <Icon icon="lucide:check" className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Icon icon="lucide:copy" className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setInvites((prev) =>
                    prev.filter((p) => p.inviteLink !== inv.inviteLink)
                  )
                }
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl bg-primary/5 p-4 text-sm text-primary">
        {t("setup.inviteNote")}
      </div>
    </div>
  )
}
