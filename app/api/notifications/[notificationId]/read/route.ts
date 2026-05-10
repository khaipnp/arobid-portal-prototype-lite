import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import { markNotificationRead } from "@/lib/notifications/service"

interface Props {
  params: Promise<{ notificationId: string }>
}

export async function PATCH(_request: Request, { params }: Props) {
  const { notificationId } = await params
  let userId = ""
  try {
    userId = await requireApiUserId()
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  if (!notificationId.trim()) {
    return NextResponse.json(
      { error: "Missing notificationId." },
      { status: 400 }
    )
  }

  try {
    const result = await markNotificationRead(userId, notificationId)
    if (!result.found) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "invalid notification id") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to mark notification as read." },
      { status: 500 }
    )
  }
}
