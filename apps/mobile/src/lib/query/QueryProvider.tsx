import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import type { ReactNode } from "react"
import { persister, queryClient } from "@/lib/query/queryClient"

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  )
}
