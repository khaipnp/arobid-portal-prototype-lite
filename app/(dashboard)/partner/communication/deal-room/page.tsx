import { DealRoomManager } from "@/components/deal-room/deal-room-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import {
  listChatUsersForPartnerOrganization,
  listConversationsForPartnerOrganization,
  listPartnerOrganizationMemberUserIds,
  listUnreadCountsForPartnerOrganization
} from "@/lib/deal-room/db"
import { getPrimaryPartnerOrganization } from "@/lib/partner/db"

export const dynamic = "force-dynamic"

const PARTNER_DEAL_ROOM_PATH = "/partner/communication/deal-room"

export default async function PartnerDealRoomPage() {
  const userId = await requireRole("partner")
  const organization = await getPrimaryPartnerOrganization(userId)

  const [
    initialUsers,
    initialConversations,
    initialUnreadCounts,
    ownSenderIds
  ] = organization
    ? await Promise.all([
        listChatUsersForPartnerOrganization(organization.id),
        listConversationsForPartnerOrganization(organization.id),
        listUnreadCountsForPartnerOrganization(organization.id),
        listPartnerOrganizationMemberUserIds(organization.id)
      ])
    : [[], [], {}, [userId]]

  return (
    <DashboardShell
      breadcrumbs={[{ label: "Communication" }, { label: "Deal Room" }]}
    >
      <DealRoomManager
        initialUsers={initialUsers}
        initialConversations={initialConversations}
        initialMessagesMap={{}}
        initialUnreadCounts={initialUnreadCounts}
        currentUserId={userId}
        basePath={PARTNER_DEAL_ROOM_PATH}
        ownSenderIds={ownSenderIds}
      />
    </DashboardShell>
  )
}
