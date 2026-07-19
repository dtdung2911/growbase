"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/useTranslation"

type CelebrationNotificationProps = {
  show: boolean
}

export function CelebrationNotification({ show }: CelebrationNotificationProps) {
  const { t } = useTranslation()
  const hasShown = useRef(false)

  useEffect(() => {
    if (show && !hasShown.current) {
      hasShown.current = true
      toast.success(t("settings.debt.celebrationMsg"), {
        duration: 5000,
      })
    }
  }, [show, t])

  return null
}
