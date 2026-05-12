import { PartnerDashboard } from "@/components/partner/partner-dashboard"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { getPartnerDashboardMetrics } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerDashboardPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const metrics = await getPartnerDashboardMetrics(userId)

  return (
    <DashboardShell
      title="Partner Dashboard"
      description="Track expo inventory, booth performance, GoLIVE reach, and partner revenue."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <PartnerDashboard metrics={metrics} />
    </DashboardShell>
  )
}
