import { NextResponse } from "next/server"
import { createMessage } from "@/lib/deal-room/db"
import type { Message } from "@/lib/deal-room/types"

interface Props {
  params: Promise<{ conversationId: string }>
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
    sentAt: body.sentAt,
  })
  return NextResponse.json({ ok: true })
}
