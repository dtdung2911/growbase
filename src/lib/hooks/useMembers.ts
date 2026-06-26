"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "@/lib/queries/queryKeys"
import { useAppStore } from "@/lib/stores/appStore"
import type { Member, Invitation } from "@/types/app"

type MembersResponse = {
  members: Member[]
  invitations: Invitation[]
}

export function useMembers() {
  const householdId = useAppStore((s) => s.householdId)

  return useQuery({
    queryKey: keys.members(householdId ?? ""),
    queryFn: async (): Promise<MembersResponse> => {
      const res = await fetch("/api/household/members")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tải được danh sách thành viên")
      return json.data
    },
    enabled: Boolean(householdId),
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/household/members/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không xóa được thành viên")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.members(householdId) })
      }
      toast.success("Đã xóa thành viên", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useLeaveHousehold() {
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/household/members/leave", {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không rời được hộ gia đình")
    },
    onSuccess: () => {
      if (householdId) {
        void qc.invalidateQueries({ queryKey: keys.members(householdId) })
        void qc.invalidateQueries({ queryKey: keys.household(householdId) })
      }
      toast.success("Đã rời hộ gia đình", { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
