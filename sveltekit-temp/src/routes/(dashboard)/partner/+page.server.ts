import { requireRole } from "$lib/auth/rbac"
import {
  getPartnerDashboardMetrics,
  getPartnerPortalSummary
} from "$lib/partner/db"
import { ensurePlatformSchema } from "$lib/platform/ensure-schema"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  await ensurePlatformSchema()
  const userId = await requireRole(event, "partner")

  const { requirePartnerTab } = await import("$lib/partner/access")
  await requirePartnerTab(userId, "overview")

  const [metrics, summary] = await Promise.all([
    getPartnerDashboardMetrics(userId),
    getPartnerPortalSummary(userId)
  ])

  return {
    metrics,
    summary
  }
}
