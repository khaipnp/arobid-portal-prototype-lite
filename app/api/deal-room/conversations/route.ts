import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import { createOrFindDirectConversation } from "@/lib/deal-room/db"

export async function POST(request: Request) {
  try {
    const userId = await requireApiUserId()
    const body = await request.json()
    const otherUserId = body?.otherUserId

    if (!otherUserId || typeof otherUserId !== "string") {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      )
    }

    if (otherUserId === userId) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      )
    }

    const conversationId = await createOrFindDirectConversation(
      userId,
      otherUserId
    )
    return NextResponse.json({ conversationId })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    console.error("Error creating conversation:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
