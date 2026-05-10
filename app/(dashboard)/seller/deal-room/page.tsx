import { DealRoomManager } from "@/components/deal-room/deal-room-manager"
import { DEAL_ROOM_CURRENT_USER_ID } from "@/lib/deal-room/constants"
import {
  listChatUsers,
  listConversations,
  listUnreadCountsForUser
} from "@/lib/deal-room/db"

export const dynamic = "force-dynamic"

export default async function DealRoomPage() {
  const [initialUsers, initialConversations, initialUnreadCounts] =
    await Promise.all([
      listChatUsers(DEAL_ROOM_CURRENT_USER_ID),
      listConversations(DEAL_ROOM_CURRENT_USER_ID),
      listUnreadCountsForUser(DEAL_ROOM_CURRENT_USER_ID)
    ])

  return (
    <DealRoomManager
      initialUsers={initialUsers}
      initialConversations={initialConversations}
      initialMessagesMap={{}}
      initialUnreadCounts={initialUnreadCounts}
      currentUserId={DEAL_ROOM_CURRENT_USER_ID}
    />
  )
}
