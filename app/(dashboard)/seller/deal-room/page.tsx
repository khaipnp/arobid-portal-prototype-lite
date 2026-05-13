import { DealRoomManager } from "@/components/deal-room/deal-room-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireAnyRole } from "@/lib/auth/rbac"
import {
  listChatUsers,
  listConversations,
  listUnreadCountsForUser
} from "@/lib/deal-room/db"

export const dynamic = "force-dynamic"

export default async function DealRoomPage() {
  const userId = await requireAnyRole(["seller", "buyer"])
  const [initialUsers, initialConversations, initialUnreadCounts] =
    await Promise.all([
      listChatUsers(userId),
      listConversations(userId),
      listUnreadCountsForUser(userId)
    ])

  return (
    <DashboardShell
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Deal Room" }
      ]}
    >
      <DealRoomManager
        initialUsers={initialUsers}
        initialConversations={initialConversations}
        initialMessagesMap={{}}
        initialUnreadCounts={initialUnreadCounts}
        currentUserId={userId}
      />
    </DashboardShell>
  )
}
