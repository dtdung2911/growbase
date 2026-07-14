"use client"

import { Icon } from "@iconify/react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"

const ASPECTS = [
  { key: "flow", icon: "lucide:arrow-left-right" },
  { key: "savings", icon: "lucide:piggy-bank" },
  { key: "budget", icon: "lucide:wallet" },
  { key: "tx", icon: "lucide:receipt-text" },
] as const

type WelcomeModalProps = {
  open: boolean
  onClose: () => void
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Icon icon="lucide:compass" className="h-7 w-7" />
          </span>

          <DialogTitle className="text-center text-2xl font-bold text-ink">
            {t("setupV2.hook.welcome.title")}
          </DialogTitle>

          <figure className="relative w-full rounded-[18px] border border-primary/15 bg-primary-soft/60 px-5 py-4 text-left">
            <span aria-hidden className="pointer-events-none absolute -top-3 left-3 font-serif text-6xl leading-none text-primary/25">
              &ldquo;
            </span>
            <blockquote className="relative pl-4 text-[15px] font-medium italic leading-relaxed text-ink">
              {t("setupV2.hook.welcome.quote")}
            </blockquote>
            <figcaption className="mt-2 pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("setupV2.hook.welcome.quoteAuthor")}
            </figcaption>
          </figure>

          <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("setupV2.hook.welcome.body")}
          </DialogDescription>

          <ul className="w-full space-y-1 rounded-[15px] bg-primary-soft/50 p-1.5">
            {ASPECTS.map((aspect) => (
              <li key={aspect.key} className="flex items-center gap-3 rounded-[11px] px-3 py-2 text-left">
                <Icon icon={aspect.icon} className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  {t(`setupV2.hook.welcome.aspect.${aspect.key}`)}
                </span>
              </li>
            ))}
          </ul>

          <Button type="button" onClick={onClose} className="w-full">
            {t("setupV2.hook.welcome.cta")}
            <Icon icon="lucide:arrow-right" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
