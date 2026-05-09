import { NextResponse } from "next/server"
import { DEAL_ROOM_CURRENT_USER_ID } from "@/lib/deal-room/constants"
import {
  listChatUsers,
  listConversations,
  listMessagesByConversation,
  listUnreadCountsForUser,
} from "@/lib/deal-room/db"

export async function GET() {
  try {
    const [users, conversations, messagesMap, unreadCounts] = await Promise.all(
      [
        listChatUsers(),
        listConversations(),
        listMessagesByConversation(),
        listUnreadCountsForUser(DEAL_ROOM_CURRENT_USER_ID),
      ],
    )

    // Filter conversations where the current user is a member
    const userConversations = conversations.filter((c) =>
      c.members.some((m) => m.userId === DEAL_ROOM_CURRENT_USER_ID),
    )

    // Format the response for the Floating Chat
    const data = userConversations.map((conv) => {
      const otherMemberId = conv.members.find(
        (m) => m.userId !== DEAL_ROOM_CURRENT_USER_ID,
      )?.userId
      const otherUser = users.find((u) => u.id === otherMemberId)
      const messages = messagesMap[conv.id] || []
      const lastMessage = messages[messages.length - 1]

      return {
        id: conv.id,
        partner: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name,
              company: otherUser.company,
              avatarUrl: otherUser.avatarUrl,
            }
          : null,
        lastMessage: lastMessage?.content || "",
        unreadCount: unreadCounts[conv.id] || 0,
        lastActive: lastMessage?.sentAt || conv.createdAt,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching chat conversations:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
