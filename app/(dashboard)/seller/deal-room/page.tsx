import { DealRoomManager } from "@/components/deal-room/deal-room-manager"
import { DEAL_ROOM_CURRENT_USER_ID } from "@/lib/deal-room/constants"
import {
  listChatUsers,
  listConversations,
  listMessagesByConversation,
  listUnreadCountsForUser,
} from "@/lib/deal-room/db"

export const dynamic = "force-dynamic"

export default async function DealRoomPage() {
  const [
    initialUsers,
    initialConversations,
    initialMessagesMap,
    initialUnreadCounts,
  ] = await Promise.all([
    listChatUsers(),
    listConversations(),
    listMessagesByConversation(),
    listUnreadCountsForUser(DEAL_ROOM_CURRENT_USER_ID),
  ])

  return (
    <DealRoomManager
      initialUsers={initialUsers}
      initialConversations={initialConversations}
      initialMessagesMap={initialMessagesMap}
      initialUnreadCounts={initialUnreadCounts}
      currentUserId={DEAL_ROOM_CURRENT_USER_ID}
    />
  )
}
