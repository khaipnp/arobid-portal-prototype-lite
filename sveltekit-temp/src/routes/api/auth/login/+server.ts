import { json } from "@sveltejs/kit"
import {
  getRequestAuditContext,
  recordUserAuditEvent
} from "$lib/administration/user-detail"
import { authenticateByEmailPassword } from "$lib/auth/service"
import { createAuthSession } from "$lib/auth/session"
import type { RequestHandler } from "./$types"

function getRedirectPath(roles: string[]) {
  if (roles.includes("sys_admin") || roles.includes("admin")) return "/admin"
  if (roles.includes("partner")) return "/partner"
  return "/seller"
}

export const POST: RequestHandler = async (event) => {
  try {
    const body = (await event.request.json()) as {
      email?: string
      password?: string
    }
    const email = body.email?.trim() ?? ""
    const password = body.password ?? ""

    if (!email || !password) {
      return json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const user = await authenticateByEmailPassword({ email, password })
    const auditContext = await getRequestAuditContext(event.request)

    if (!user) {
      return json({ error: "Invalid email or password." }, { status: 401 })
    }

    await createAuthSession(user.id, event)
    await recordUserAuditEvent({
      targetUserId: user.id,
      actorUserId: user.id,
      actorType: "user",
      action: "auth.login.success",
      resourceType: "auth_session",
      resourceId: user.id,
      summary: "User signed in.",
      metadata: { roles: user.roles },
      ...auditContext
    })

    return json({
      ok: true,
      redirectPath: getRedirectPath(user.roles),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    })
  } catch {
    return json({ error: "Failed to sign in." }, { status: 500 })
  }
}
