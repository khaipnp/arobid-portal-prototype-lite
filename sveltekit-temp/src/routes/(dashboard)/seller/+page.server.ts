import { requireAnyRole, userHasRole } from "$lib/auth/rbac"
import { listSellerBoothRegistrations } from "$lib/tradexpo/db/platform-data"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  const userId = await requireAnyRole(event, ["seller", "buyer"])
  const isSeller = await userHasRole(userId, "seller")
  const registrations = await listSellerBoothRegistrations(userId)
  const myExpoIds = [...new Set(registrations.map((r) => r.expoId))]
  const liveCount = registrations.filter((r) => r.status === "Live").length
  const pendingCount = registrations.filter(
    (r) => r.status === "Pending Setup"
  ).length

  return {
    isSeller,
    myExpoIdsLength: myExpoIds.length,
    liveCount,
    pendingCount
  }
}
