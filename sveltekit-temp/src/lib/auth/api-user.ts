import type { Cookies } from "@sveltejs/kit"
import { getCurrentSessionUserId } from "$lib/auth/session"

export async function requireApiUserId(cookies: Cookies) {
  const userId = await getCurrentSessionUserId(cookies)
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}
