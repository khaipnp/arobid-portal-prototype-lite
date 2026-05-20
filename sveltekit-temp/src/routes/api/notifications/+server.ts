import { json } from "@sveltejs/kit"
import { requireApiUserId } from "$lib/auth/api-user"
import { listNotifications } from "$lib/notifications/service"
import type { RequestHandler } from "./$types"

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

export const GET: RequestHandler = async (event) => {
  let userId = ""
  try {
    userId = await requireApiUserId(event.cookies)
  } catch {
    return json({ error: "Unauthorized." }, { status: 401 })
  }

  const { searchParams } = event.url
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 20
  if (!Number.isFinite(limit) || limit <= 0) {
    return json({ error: "Invalid limit." }, { status: 400 })
  }

  const cursor = searchParams.get("cursor") ?? undefined
  if (cursor && !isValidCursor(cursor)) {
    return json({ error: "Invalid cursor." }, { status: 400 })
  }

  try {
    const notifications = await listNotifications(userId, { limit, cursor })
    return json({ notifications })
  } catch {
    return json({ error: "Failed to list notifications." }, { status: 500 })
  }
}
