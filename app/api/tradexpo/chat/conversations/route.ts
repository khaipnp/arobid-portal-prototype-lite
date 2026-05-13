import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import {
  listChatUsers,
  listConversations,
  listMessagesByConversation,
  listUnreadCountsForUser
} from "@/lib/deal-room/db"

export async function GET() {
  try {
    const userId = await requireApiUserId()
    const [users, conversations, messagesMap, unreadCounts] = await Promise.all(
      [
        listChatUsers(userId),
        listConversations(userId),
        listMessagesByConversation(userId),
        listUnreadCountsForUser(userId)
      ]
    )

    // Filter conversations where the current user is a member
    const userConversations = conversations.filter((c) =>
      c.members.some((m) => m.userId === userId)
    )

    // Format the response for the Floating Chat
    const data = userConversations.map((conv) => {
      const otherMemberId = conv.members.find(
        (m) => m.userId !== userId
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
              avatarUrl: otherUser.avatarUrl
            }
          : null,
        lastMessage: lastMessage?.content || "",
        unreadCount: unreadCounts[conv.id] || 0,
        lastActive: lastMessage?.sentAt || conv.createdAt
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error fetching chat conversations:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
