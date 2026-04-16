import { NextResponse } from "next/server"
import { markAllNotificationsRead } from "@/lib/notifications/service"

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId =
    searchParams.get("userId") ?? request.headers.get("x-user-id") ?? ""

  if (!userId.trim()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    await markAllNotificationsRead(userId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to mark notifications as read." },
      { status: 500 },
    )
  }
}
