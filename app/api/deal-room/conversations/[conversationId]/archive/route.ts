import { NextResponse } from "next/server"
import { archiveConversationForUser } from "@/lib/deal-room/db"

interface Props {
  params: Promise<{ conversationId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { conversationId } = await params
  const body = (await request.json()) as { userId?: string }
  if (!body.userId) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }
  await archiveConversationForUser({
    conversationId,
    userId: body.userId,
  })
  return NextResponse.json({ ok: true })
}
