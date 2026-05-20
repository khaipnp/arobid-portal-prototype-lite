import { json } from "@sveltejs/kit"
import {
  authenticateByDemoRole,
  DEMO_LOGIN_ROLES,
  type DemoLoginRole
} from "$lib/auth/service"
import { createAuthSession } from "$lib/auth/session"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async (event) => {
  try {
    const body = (await event.request.json()) as { role?: string }
    const role = body.role?.trim() as DemoLoginRole | undefined

    if (!role || !DEMO_LOGIN_ROLES.includes(role)) {
      return json({ error: "Invalid role." }, { status: 400 })
    }

    const user = await authenticateByDemoRole({ role })
    if (!user) {
      return json({ error: "Demo account not found." }, { status: 404 })
    }

    await createAuthSession(user.id, event)

    return json({
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
    return json({ error: "Failed to sign in." }, { status: 500 })
  }
}
