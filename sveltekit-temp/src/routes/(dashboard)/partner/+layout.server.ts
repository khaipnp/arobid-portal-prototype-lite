import { requireRole } from "$lib/auth/rbac"
import { getAuthenticatedUserById } from "$lib/auth/service"
import { getPartnerAccess } from "$lib/partner/access"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async (event) => {
  const userId = await requireRole(event, "partner")
  const [user, partnerAccess] = await Promise.all([
    getAuthenticatedUserById(userId),
    getPartnerAccess(userId)
  ])

  return {
    partnerAccess,
    user: {
      name: user?.name ?? "User",
      email: user?.email ?? "",
      avatar: "/avatar.webp",
      roles: user?.roles ?? []
    }
  }
}
