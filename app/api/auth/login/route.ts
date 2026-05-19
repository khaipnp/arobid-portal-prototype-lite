import { NextResponse } from "next/server"
import {
  getRequestAuditContext,
  recordUserAuditEvent
} from "@/lib/administration/user-detail"
import { authenticateByEmailPassword } from "@/lib/auth/service"
import { createAuthSession } from "@/lib/auth/session"

function getRedirectPath(roles: string[]) {
  if (roles.includes("sys_admin") || roles.includes("admin")) return "/admin"
  if (roles.includes("partner")) return "/partner"
  return "/seller"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }
    const email = body.email?.trim() ?? ""
    const password = body.password ?? ""
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const user = await authenticateByEmailPassword({ email, password })
    const auditContext = await getRequestAuditContext()
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    await createAuthSession(user.id)
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
    return NextResponse.json({
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
    return NextResponse.json({ error: "Failed to sign in." }, { status: 500 })
  }
}
