"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/stores/appStore"

const SESSION_KEY = "growbase.activity-recorded"

// Fire-and-forget: ghi 1 ngày hoạt động, không block render, 1 lần/session
export function useRecordActivity() {
  const householdId = useAppStore((s) => s.householdId)

  useEffect(() => {
    if (!householdId) return
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, "1")
    void fetch("/api/activity/heartbeat", { method: "POST" })
  }, [householdId])
}
