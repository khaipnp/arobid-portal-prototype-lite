import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import {
  isConversationParticipant,
  softDeleteMessage,
  updateMessageContent
} from "@/lib/deal-room/db"

interface Props {
  params: Promise<{ conversationId: string; messageId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { conversationId, messageId } = await params
    const userId = await requireApiUserId()
    const body = (await request.json()) as {
      content?: string
      editedAt?: string
    }
    if (!body.content || !body.editedAt) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
    }
    const canAccessConversation = await isConversationParticipant({
      conversationId,
      userId
    })
    if (!canAccessConversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      )
    }
    const updated = await updateMessageContent({
      messageId,
      conversationId,
      senderId: userId,
      content: body.content,
      editedAt: body.editedAt
    })
    if (!updated) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error updating message:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    const { conversationId, messageId } = await params
    const userId = await requireApiUserId()
    const canAccessConversation = await isConversationParticipant({
      conversationId,
      userId
    })
    if (!canAccessConversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      )
    }
    const deleted = await softDeleteMessage({
      conversationId,
      messageId,
      senderId: userId
    })
    if (!deleted) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error deleting message:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
