import { NextResponse } from "next/server"
import {
  authenticateByDemoRole,
  DEMO_LOGIN_ROLES,
  type DemoLoginRole
} from "@/lib/auth/service"
import { createAuthSession } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { role?: string }
    const role = body.role?.trim() as DemoLoginRole | undefined
    if (!role || !DEMO_LOGIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 })
    }

    const user = await authenticateByDemoRole({ role })
    if (!user) {
      return NextResponse.json({ error: "Demo account not found." }, { status: 404 })
    }

    await createAuthSession(user.id)
    return NextResponse.json({
      ok: true,
      redirectPath: user.redirectPath,
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
