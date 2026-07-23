"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTransactions } from "@/lib/hooks/useTransactions"
import { txDateVN } from "@growbase/shared/rules/date"

const REMINDER_HOUR = 18
const DISMISS_KEY_PREFIX = "tx-reminder-dismissed:"

function todayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function useTransactionReminder(): {
  showReminder: boolean
  dismiss: () => void
} {
  const { data: transactions, isLoading } = useTransactions()
  const today = todayKey()
  const storageKey = `${DISMISS_KEY_PREFIX}${today}`

  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    setDismissed(window.sessionStorage.getItem(storageKey) === "1")
  }, [storageKey])

  const dismiss = useCallback(() => {
    setDismissed(true)
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "1")
    }
  }, [storageKey])

  const hasTodayTransaction = useMemo(
    () => (transactions ?? []).some((tx) => txDateVN(tx.transaction_date) === today),
    [transactions, today]
  )

  const afterReminderHour = new Date().getHours() >= REMINDER_HOUR

  const showReminder =
    afterReminderHour &&
    !dismissed &&
    !isLoading &&
    transactions !== undefined &&
    !hasTodayTransaction

  return { showReminder, dismiss }
}
