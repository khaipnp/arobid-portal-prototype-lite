import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import {
  archiveConversationForPartnerOrganization,
  archiveConversationForUser,
  findConversationPartnerOrganizationForUser,
  isConversationMember
} from "@/lib/deal-room/db"

interface Props {
  params: Promise<{ conversationId: string }>
}

export async function PATCH(_request: Request, { params }: Props) {
  try {
    const { conversationId } = await params
    const userId = await requireApiUserId()
    const isUserMember = await isConversationMember({ conversationId, userId })
    if (isUserMember) {
      const archived = await archiveConversationForUser({
        conversationId,
        userId
      })
      if (!archived) {
        return NextResponse.json(
          { error: "Conversation not found." },
          { status: 404 }
        )
      }
      return NextResponse.json({ ok: true })
    }

    const partnerOrgId = await findConversationPartnerOrganizationForUser({
      conversationId,
      userId
    })
    if (!partnerOrgId) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      )
    }
    const archived = await archiveConversationForPartnerOrganization({
      conversationId,
      partnerOrgId
    })
    if (!archived) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error archiving conversation:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
