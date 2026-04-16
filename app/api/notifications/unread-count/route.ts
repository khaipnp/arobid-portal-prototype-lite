import { NextResponse } from "next/server"
import { getUnreadCount } from "@/lib/notifications/service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId =
    searchParams.get("userId") ?? request.headers.get("x-user-id") ?? ""

  if (!userId.trim()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const unreadCount = await getUnreadCount(userId)
    return NextResponse.json({ unreadCount })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch unread count." },
      { status: 500 },
    )
  }
}
