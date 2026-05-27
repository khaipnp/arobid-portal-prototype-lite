import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import {
  createMessage,
  isConversationParticipant,
  listConversationMessages
} from "@/lib/deal-room/db"
import type { Message } from "@/lib/deal-room/types"

interface Props {
  params: Promise<{ conversationId: string }>
}

export async function GET(_request: Request, { params }: Props) {
  const { conversationId } = await params
  try {
    const userId = await requireApiUserId()
    const messages = await listConversationMessages({
      conversationId,
      userId
    })

    return NextResponse.json({ messages })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { conversationId } = await params
    const userId = await requireApiUserId()
    const body = (await request.json()) as {
      id?: string
      senderId?: string
      content?: string
      attachments?: Message["attachments"]
      status?: Message["status"]
      sentAt?: string
    }
    if (!body.id || !body.senderId || !body.sentAt) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
    }
    if (body.senderId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
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
    await createMessage({
      id: body.id,
      conversationId,
      senderId: userId,
      content: body.content ?? "",
      attachments: body.attachments ?? [],
      status: body.status ?? "sent",
      sentAt: body.sentAt
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
