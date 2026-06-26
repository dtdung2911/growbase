"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { InviteInput } from "@/lib/validations/household"

type CreateInviteResult = { token: string; inviteLink: string }
type AcceptInviteResult = {
  household_id: string
  member_id: string
  alreadyMember: boolean
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: async (input: InviteInput): Promise<CreateInviteResult> => {
      const res = await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tạo được lời mời")
      return json.data
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string): Promise<AcceptInviteResult> => {
      const res = await fetch(`/api/household/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Không tham gia được hộ")
      return json.data
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 })
    },
  })
}
