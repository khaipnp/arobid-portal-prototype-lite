import { PartnerDashboard } from "@/components/partner/partner-dashboard"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import {
  getPartnerDashboardMetrics,
  getPartnerPortalSummary
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerDashboardPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  await requirePartnerTab(userId, "overview")
  const [metrics, summary] = await Promise.all([
    getPartnerDashboardMetrics(userId),
    getPartnerPortalSummary(userId)
  ])

  return (
    <DashboardShell breadcrumbs={[{ label: "Dashboard" }]}>
      <PartnerDashboard metrics={metrics} />
    </DashboardShell>
  )
}
