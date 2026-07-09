"use client"

import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  ONBOARDING_V2_TOTAL_STEPS,
  useOnboardingV2Store,
} from "@/lib/stores/onboardingV2Store"
import { useTranslation } from "@/lib/i18n/useTranslation"
import ArrowFatLinesLeftDuotoneIcon from "@iconify-react/ph/arrow-fat-lines-left-duotone";
import ChevronRightCircleDuotoneIcon from "@iconify-react/si/chevron-right-circle-duotone";
import ChevronLeftCircleDuotoneIcon from "@iconify-react/si/chevron-left-circle-duotone";
import CloseCircleDuotoneIcon from "@iconify-react/si/close-circle-duotone";

export function OnboardingV2Shell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const step = useOnboardingV2Store((s) => s.step)
  const next = useOnboardingV2Store((s) => s.next)
  const prev = useOnboardingV2Store((s) => s.prev)
  const canProceed = useOnboardingV2Store((s) => s.canProceed())

  const progress = ((step + 1) / ONBOARDING_V2_TOTAL_STEPS) * 100
  const showPrev = step > 0 && step < ONBOARDING_V2_TOTAL_STEPS - 1

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-10 bg-background">
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-1 bg-primary [transition:width_300ms_ease] motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mx-auto max-w-2xl px-4 pt-3 text-sm text-muted-foreground">
          {t("setupV2.nav.stepLabel", {
            current: step + 1,
            total: ONBOARDING_V2_TOTAL_STEPS,
          })}
        </p>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4">
        {children}
      </main>

      {step < ONBOARDING_V2_TOTAL_STEPS - 1 && (
        <footer className="sticky bottom-0 z-10 border-t border-border/40 bg-card shadow-card">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-6">
            {showPrev && (
              <Button
                type="button"
                variant="ghost"
                onClick={prev}
                className="min-h-[44px]"
              >
                <ChevronLeftCircleDuotoneIcon height="1em" />
                {t("setupV2.nav.back")}
              </Button>
            )}
            {step === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={next}
                className="min-h-[44px]"
              >
                <CloseCircleDuotoneIcon height="12em" />
                {t("setupV2.nav.skip")}
              </Button>
            )}
            <Button
              type="button"
              onClick={next}
              disabled={!canProceed}
              className="ml-auto min-h-[44px] flex-1 sm:flex-none"
            >
              {step === 0 ? t("setupV2.hook.cta") : t("setupV2.nav.next")}
              <ChevronRightCircleDuotoneIcon height="12em" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
