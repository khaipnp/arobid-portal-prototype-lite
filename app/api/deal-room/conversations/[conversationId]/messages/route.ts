import { NextResponse } from "next/server"
import { sql } from "@/lib/db/neon"
import { createMessage } from "@/lib/deal-room/db"
import type { Message } from "@/lib/deal-room/types"

interface Props {
  params: Promise<{ conversationId: string }>
}

export async function GET(_request: Request, { params }: Props) {
  const { conversationId } = await params
  try {
    const rows = (await sql`
      select * from chat_messages
      where conversation_id = ${conversationId}
      order by sent_at asc
    `) as any[]

    const messages = rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      content: r.content,
      attachments: r.attachments ?? [],
      status: r.status,
      sentAt: new Date(r.sent_at).toISOString(),
      editedAt: r.edited_at ? new Date(r.edited_at).toISOString() : undefined,
      isDeleted: r.is_deleted,
      isSystemMessage: r.is_system_message
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: Props) {
  const { conversationId } = await params
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
  await createMessage({
    id: body.id,
    conversationId,
    senderId: body.senderId,
    content: body.content ?? "",
    attachments: body.attachments ?? [],
    status: body.status ?? "sent",
    sentAt: body.sentAt
  })
  return NextResponse.json({ ok: true })
}
