import { DealRoomManager } from "@/components/deal-room/deal-room-manager"
import { requireRole } from "@/lib/auth/rbac"
import {
  listChatUsersForPartnerOrganization,
  listConversationsForPartnerOrganization,
  listMessagesByConversationForPartnerOrganization,
  listPartnerOrganizationMemberUserIds,
  listUnreadCountsForPartnerOrganization
} from "@/lib/deal-room/db"
import { getPrimaryPartnerOrganization } from "@/lib/partner/db"

interface Props {
  params: Promise<{ conversationId: string }>
}

export const dynamic = "force-dynamic"

const PARTNER_DEAL_ROOM_PATH = "/partner/communication/deal-room"

export default async function PartnerConversationPage({ params }: Props) {
  const { conversationId } = await params
  const userId = await requireRole("partner")
  const organization = await getPrimaryPartnerOrganization(userId)

  const [
    initialUsers,
    initialConversations,
    initialMessagesMap,
    initialUnreadCounts,
    ownSenderIds
  ] = organization
    ? await Promise.all([
        listChatUsersForPartnerOrganization(organization.id),
        listConversationsForPartnerOrganization(organization.id),
        listMessagesByConversationForPartnerOrganization(organization.id),
        listUnreadCountsForPartnerOrganization(organization.id),
        listPartnerOrganizationMemberUserIds(organization.id)
      ])
    : [[], [], {}, {}, [userId]]

  return (
    <DealRoomManager
      initialConversationId={conversationId}
      initialUsers={initialUsers}
      initialConversations={initialConversations}
      initialMessagesMap={initialMessagesMap}
      initialUnreadCounts={initialUnreadCounts}
      currentUserId={userId}
      basePath={PARTNER_DEAL_ROOM_PATH}
      ownSenderIds={ownSenderIds}
    />
  )
}
