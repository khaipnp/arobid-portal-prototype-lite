import { json } from "@sveltejs/kit"
import { getAuthenticatedUserById } from "$lib/auth/service"
import { getCurrentSessionUserId } from "$lib/auth/session"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async (event) => {
  try {
    const userId = await getCurrentSessionUserId(event.cookies, {
      clearInvalidCookie: true
    })

    if (!userId) {
      return json({ authenticated: false }, { status: 401 })
    }

    const user = await getAuthenticatedUserById(userId)
    if (!user) {
      return json({ authenticated: false }, { status: 401 })
    }

    return json({ authenticated: true, user })
  } catch {
    return json({ error: "Failed to resolve session." }, { status: 500 })
  }
}
