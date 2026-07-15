"use client"

import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { TranslationProvider } from "@/lib/i18n/TranslationProvider"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="growbase-theme"
      disableTransitionOnChange
    >
      <TranslationProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors position="top-center" />
        </QueryClientProvider>
      </TranslationProvider>
    </ThemeProvider>
  )
}
