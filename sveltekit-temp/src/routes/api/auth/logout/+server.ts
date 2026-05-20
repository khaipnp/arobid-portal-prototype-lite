import { json } from "@sveltejs/kit"
import {
  getRequestAuditContext,
  recordUserAuditEvent
} from "$lib/administration/user-detail"
import {
  getCurrentSessionUserId,
  revokeCurrentAuthSession
} from "$lib/auth/session"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async (event) => {
  try {
    const userId = await getCurrentSessionUserId(event.cookies)
    const auditContext = await getRequestAuditContext(event.request)
    await revokeCurrentAuthSession(event.cookies)

    if (userId) {
      await recordUserAuditEvent({
        targetUserId: userId,
        actorUserId: userId,
        actorType: "user",
        action: "auth.logout",
        resourceType: "auth_session",
        resourceId: userId,
        summary: "User signed out.",
        metadata: {},
        ...auditContext
      })
    }
    return json({ ok: true })
  } catch (error) {
    console.error("Logout API error:", error)
    return json({ error: "Failed to sign out." }, { status: 500 })
  }
}
