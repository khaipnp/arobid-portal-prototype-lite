import { redirect } from "@sveltejs/kit"
import { getAuthenticatedUserById } from "$lib/auth/service"
import { getCurrentSessionUserId } from "$lib/auth/session"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  const userId = await getCurrentSessionUserId(event.cookies)

  if (userId) {
    const callbackUrl = event.url.searchParams.get("callbackUrl")
    if (callbackUrl) {
      throw redirect(303, callbackUrl)
    }

    const user = await getAuthenticatedUserById(userId)
    if (user?.roles.includes("sys_admin") || user?.roles.includes("admin")) {
      throw redirect(303, "/admin")
    }
    if (user?.roles.includes("partner")) {
      throw redirect(303, "/partner")
    }
    throw redirect(303, "/seller")
  }

  return {}
}
