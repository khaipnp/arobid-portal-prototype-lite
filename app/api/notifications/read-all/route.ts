import { NextResponse } from "next/server"
import { requireApiUserId } from "@/lib/auth/api-user"
import { markAllNotificationsRead } from "@/lib/notifications/service"

export async function POST() {
  let userId = ""
  try {
    userId = await requireApiUserId()
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    await markAllNotificationsRead(userId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to mark notifications as read." },
      { status: 500 }
    )
  }
}
