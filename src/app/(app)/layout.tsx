"use client"

import { useEffect, useState, type ReactNode } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { useAppStore, type HouseholdSummary } from "@/lib/stores/appStore"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

function AppLayoutSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Desktop sidebar placeholder */}
      <div className="fixed inset-y-3  z-40 hidden w-[var(--sidebar-width)] rounded-3xl bg-card shadow-sidebar lg:block">
        <div className="px-6 pt-7">
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="space-y-2 px-5 pt-6">
          <Skeleton className="mb-4 h-3 w-12" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-full" />
          ))}
          <Skeleton className="mb-4 mt-4 h-3 w-16" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={`a-${i}`} className="h-11 w-full rounded-full" />
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 lg:pl-[calc(var(--sidebar-width)+24px)]">
        <div className="p-4 space-y-4 lg:px-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 shadow-soft-md backdrop-blur-md lg:hidden">
        <div className="flex justify-around p-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const setHouseholdId = useAppStore((s) => s.setHouseholdId)
  const setAllHouseholds = useAppStore((s) => s.setAllHouseholds)
  const setUser = useAppStore((s) => s.setUser)
  const householdId = useAppStore((s) => s.householdId)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setHydrated(true)
        return
      }
      setUser(user)

      const { data } = await supabase
        .from("household_members")
        .select("role, households(id, name)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("joined_at", { ascending: true })

      const allHouseholds: HouseholdSummary[] = (data ?? []).map((m) => ({
        id: (m.households as { id: string; name: string }).id,
        name: (m.households as { id: string; name: string }).name,
        role: m.role as "owner" | "member",
      }))

      setAllHouseholds(allHouseholds)

      const validId =
        householdId && allHouseholds.some((h) => h.id === householdId)
          ? householdId
          : (allHouseholds[0]?.id ?? null)

      setHouseholdId(validId)
      setHydrated(true)
    }

    void init()
  }, [setHouseholdId, setAllHouseholds, setUser])

  if (!hydrated) {
    return <AppLayoutSkeleton />
  }

  return <AppShell>{children}</AppShell>
}
