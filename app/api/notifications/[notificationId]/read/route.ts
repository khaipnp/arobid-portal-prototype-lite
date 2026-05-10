import { NextResponse } from "next/server"
import { markNotificationRead } from "@/lib/notifications/service"

interface Props {
  params: Promise<{ notificationId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const { notificationId } = await params
  const { searchParams } = new URL(request.url)
  const userId =
    searchParams.get("userId") ?? request.headers.get("x-user-id") ?? ""

  if (!userId.trim()) {
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
