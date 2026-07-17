import { keys } from "@growbase/shared/queryKeys"
import type { Member } from "@growbase/shared/types/app"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/api/client"
import { useAppStore } from "@/store/appStore"

type MembersResponse = { members: Member[] }

export function useMyMemberId() {
  const user = useAppStore((s) => s.user)
  const householdId = useAppStore((s) => s.householdId)
  const isLocked = useAppStore((s) => s.isLocked)

  return useQuery({
    queryKey: keys.members(householdId ?? ""),
    queryFn: () => apiFetch<MembersResponse>("/api/household/members"),
    enabled: !!user && !!householdId && !isLocked,
    select: (data) => data.members.find((m) => m.user_id === user?.id)?.id ?? null,
  })
}
