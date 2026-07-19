"use client"

import type { ReactNode } from "react"
import { DesktopDrawer } from "@/components/layout/DesktopDrawer"
import { BottomNav } from "@/components/layout/BottomNav"
import { TopHeader } from "@/components/layout/TopHeader"
import { QuickAddFAB } from "@/components/transactions/QuickAddFAB"

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <DesktopDrawer />
      <div className="lg:pl-[calc(var(--sidebar-width)-1px)]">
        <TopHeader />
        <main className="animate-page-in mx-auto max-w-md p-4 pb-20 lg:max-w-[86rem] lg:px-6 lg:pb-8 lg:pt-16">
          {children}
        </main>
      </div>
      <BottomNav />
      <QuickAddFAB />
    </>
  );
}
