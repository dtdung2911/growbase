import { createClient } from "@/lib/supabase/server"
import { InviteClient } from "./InviteClient"

type Props = { params: { token: string } }

export default async function InvitePage({ params }: Props) {
  const supabase = createClient()
  const { token } = params

  const { data: invitation } = await supabase
    .rpc("get_invitation_by_token", { p_token: token })
    .maybeSingle()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isExpired =
    invitation != null &&
    (invitation.status !== "pending" ||
      new Date(invitation.expires_at) < new Date())

  return (
    <InviteClient
      token={token}
      isAuthenticated={Boolean(user)}
      invitation={
        invitation
          ? {
              householdName: invitation.household_name,
              displayName: invitation.display_name,
            }
          : null
      }
      isExpired={isExpired}
    />
  )
}
