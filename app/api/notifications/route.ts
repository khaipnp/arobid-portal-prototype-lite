import { NextResponse } from "next/server"
import { listNotifications } from "@/lib/notifications/service"
import { requireApiUserId } from "@/lib/auth/api-user"

function isValidCursor(cursor: string) {
  const [createdAtRaw, notificationIdRaw] = cursor.split("|")
  if (!createdAtRaw?.trim()) return false
  const createdAt = new Date(createdAtRaw.trim())
  if (Number.isNaN(createdAt.getTime())) return false
  if (!notificationIdRaw) return true
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    notificationIdRaw.trim()
  )
}

export async function GET(request: Request) {
  let userId = ""
  try {
    userId = await requireApiUserId()
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 20
  if (!Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json({ error: "Invalid limit." }, { status: 400 })
  }

  const cursor = searchParams.get("cursor") ?? undefined
  if (cursor && !isValidCursor(cursor)) {
    return NextResponse.json({ error: "Invalid cursor." }, { status: 400 })
  }

  try {
    const notifications = await listNotifications(userId, { limit, cursor })
    return NextResponse.json({ notifications })
  } catch {
    return NextResponse.json(
      { error: "Failed to list notifications." },
      { status: 500 }
    )
  }
}
