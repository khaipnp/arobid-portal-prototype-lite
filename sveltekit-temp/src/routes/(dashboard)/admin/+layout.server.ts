import { requireRole } from "$lib/auth/rbac"
import { getAuthenticatedUserById } from "$lib/auth/service"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async (event) => {
  const userId = await requireRole(event, "admin")
  const user = await getAuthenticatedUserById(userId)

  return {
    user: {
      name: user?.name ?? "User",
      email: user?.email ?? "",
      avatar: "/avatar.webp",
      roles: user?.roles ?? []
    }
  }
}
