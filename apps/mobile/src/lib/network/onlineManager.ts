import NetInfo from "@react-native-community/netinfo"
import { onlineManager } from "@tanstack/react-query"
import { processQueue } from "@/lib/sync/syncEngine"

let bridged = false

// Wire real device connectivity into TanStack's onlineManager and drain the
// durable queue on every offline→online transition.
export function bridgeOnlineManager(): void {
  if (bridged) return
  bridged = true

  onlineManager.setEventListener((setOnline) => {
    let prevOnline = onlineManager.isOnline()
    return NetInfo.addEventListener((state) => {
      // Both fields are null while unknown (e.g. right after the listener attaches) —
      // treat unknown as online rather than forcing every cold start into offline mode.
      const online = state.isConnected !== false && state.isInternetReachable !== false
      setOnline(online)
      if (online && !prevOnline) void processQueue()
      prevOnline = online
    })
  })
}
