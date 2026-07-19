import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { useEffect, type ReactNode } from "react"
import { bridgeOnlineManager } from "@/lib/network/onlineManager"
import { persister, queryClient } from "@/lib/query/queryClient"
import { processQueue } from "@/lib/sync/syncEngine"
import { useAppStore } from "@/store/appStore"

export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    bridgeOnlineManager()
    // Real connectivity isn't known synchronously (NetInfo's first event arrives
    // async), so always attempt a drain — processQueue() is a safe no-op offline.
    void processQueue()

    // householdId can still be rehydrating from storage on cold start; retry once
    // it lands so a prior session's queued items aren't stranded until some other
    // trigger (reconnect, new mutation) happens to fire.
    return useAppStore.subscribe((state, prev) => {
      if (!prev.householdId && state.householdId) void processQueue()
    })
  }, [])

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  )
}
