import { DealRoomManager } from "@/components/deal-room/deal-room-manager"
import { requireRole } from "@/lib/auth/rbac"
import {
  listChatUsers,
  listConversations,
  listUnreadCountsForUser
} from "@/lib/deal-room/db"

export const dynamic = "force-dynamic"

export default async function DealRoomPage() {
  const userId = await requireRole("seller")
  const [initialUsers, initialConversations, initialUnreadCounts] =
    await Promise.all([
      listChatUsers(userId),
      listConversations(userId),
      listUnreadCountsForUser(userId)
    ])

  return (
    <DealRoomManager
      initialUsers={initialUsers}
      initialConversations={initialConversations}
      initialMessagesMap={{}}
      initialUnreadCounts={initialUnreadCounts}
      currentUserId={userId}
    />
  )
}
