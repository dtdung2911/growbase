"use client"

import { type ReactNode } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { useTranslation } from "@/lib/i18n/useTranslation"

interface WizardLayoutProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip?: () => void
  isPending?: boolean
  nextDisabled?: boolean
  nextLabel?: string
  showPrev?: boolean
  children: ReactNode
}

export function WizardLayout({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isPending,
  nextDisabled,
  nextLabel,
  showPrev = true,
  children,
}: WizardLayoutProps) {
  const { t } = useTranslation()
  const progress = (currentStep / totalSteps) * 100
  const resolvedNextLabel = nextLabel ?? t("setup.next")

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-10 bg-background">
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-1 bg-primary [transition:width_300ms_ease] motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mx-auto max-w-lg px-4 pt-3 text-sm text-muted-foreground">
          {t("setup.stepLabel", { current: currentStep, total: totalSteps })}
        </p>
      </div>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        {children}
      </main>

      <footer className="sticky bottom-0 z-10 bg-card shadow-soft">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 pb-16">
          {showPrev && (
            <Button
              type="button"
              variant="ghost"
              onClick={onPrev}
              disabled={isPending}
            >
              {t("setup.back")}
            </Button>
          )}
          {onSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              disabled={isPending}
            >
              {t("setup.skip")}
            </Button>
          )}
          <Button
            type="button"
            onClick={onNext}
            disabled={isPending || nextDisabled}
            className={cn("ml-auto flex-1 sm:flex-none")}
          >
            {isPending && <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />}
            {resolvedNextLabel}
          </Button>
        </div>
      </footer>
    </div>
  )
}
