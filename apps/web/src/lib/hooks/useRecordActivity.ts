"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/stores/appStore"
import { todayVN } from "@growbase/shared/rules/date"

// Ghi 1 ngày hoạt động, tối đa 1 lần/user/ngày trong 1 session. Fire-and-forget:
// chỉ đặt cờ khi POST thành công để lỗi mạng còn retry được lần sau trong session.
export async function recordActivityOnce(userId: string): Promise<void> {
  const key = `growbase.activity-recorded:${userId}:${todayVN()}`
  try {
    if (sessionStorage.getItem(key)) return
  } catch {
    // private mode: bỏ qua dedupe, vẫn thử POST
  }
  const res = await fetch("/api/activity/heartbeat", { method: "POST" })
  if (!res.ok) return
  try {
    sessionStorage.setItem(key, "1")
  } catch {
    // private mode
  }
}

export function useRecordActivity() {
  const householdId = useAppStore((s) => s.householdId)
  const userId = useAppStore((s) => s.user?.id)

  useEffect(() => {
    if (!householdId || !userId) return
    void recordActivityOnce(userId).catch(() => {})
  }, [householdId, userId])
}
