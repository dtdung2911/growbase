import { onlineManager } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"

// onlineManager is already bridged to NetInfo in onlineManager.ts — read from it
// rather than opening a second device subscription.
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  )
}
