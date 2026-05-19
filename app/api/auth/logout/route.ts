import { NextResponse } from "next/server"
import {
  getRequestAuditContext,
  recordUserAuditEvent
} from "@/lib/administration/user-detail"
import {
  getCurrentSessionUserId,
  revokeCurrentAuthSession
} from "@/lib/auth/session"

export async function POST() {
  try {
    const userId = await getCurrentSessionUserId()
    const auditContext = await getRequestAuditContext()
    await revokeCurrentAuthSession()
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
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to sign out." }, { status: 500 })
  }
}
