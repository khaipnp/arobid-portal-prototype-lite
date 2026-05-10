import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import { getUnreadCount } from "@/lib/notifications/service"

export async function GET() {
  let userId = ""
  try {
    userId = await requireApiUserId()
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const unreadCount = await getUnreadCount(userId)
    return NextResponse.json({ unreadCount })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch unread count." },
      { status: 500 }
    )
  }
}
