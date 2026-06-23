import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import {
  createMessage,
  isConversationParticipant,
  updateRfqStatus
} from "@/lib/deal-room/db"

interface Props {
  params: Promise<{ conversationId: string; messageId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { conversationId, messageId } = await params
    const userId = await requireApiUserId()

    const body = (await request.json()) as { status?: string }
    if (body.status !== "quoted" && body.status !== "closed") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 })
    }

    const canAccess = await isConversationParticipant({
      conversationId,
      userId
    })
    if (!canAccess) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      )
    }

    const result = await updateRfqStatus({
      messageId,
      conversationId,
      requesterId: userId,
      status: body.status
    })
    if (!result) {
      return NextResponse.json(
        { error: "RFQ not found or cannot be updated." },
        { status: 404 }
      )
    }

    const label = body.status === "quoted" ? "Quoted" : "Closed"
    await createMessage({
      id: `msg-sys-${Date.now()}`,
      conversationId,
      senderId: "system",
      content: `RFQ for "${result.productName}" has been marked as ${label}.`,
      attachments: [],
      status: "sent",
      sentAt: new Date().toISOString(),
      kind: "text"
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error updating RFQ status:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
