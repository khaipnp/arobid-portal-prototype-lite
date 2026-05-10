import { NextResponse } from "next/server"
import { softDeleteMessage, updateMessageContent } from "@/lib/deal-room/db"

interface Props {
  params: Promise<{ conversationId: string; messageId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { conversationId, messageId } = await params
  const body = (await request.json()) as { content?: string; editedAt?: string }
  if (!body.content || !body.editedAt) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  await updateMessageContent({
    messageId,
    conversationId,
    content: body.content,
    editedAt: body.editedAt
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { conversationId, messageId } = await params
  await softDeleteMessage({ conversationId, messageId })
  return NextResponse.json({ ok: true })
}
