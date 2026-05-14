import { PartnerAnalyticsReportCenter } from "@/components/partner/partner-analytics-report-center"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { getPartnerAnalyticsWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerAnalyticsPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const workspace = await getPartnerAnalyticsWorkspace(userId)

  return (
    <DashboardShell
      title="Analytics & Reports"
      description="Monitor trade activity and report readiness for partner and government programs."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Analytics & Reports" }
      ]}
    >
      <PartnerAnalyticsReportCenter workspace={workspace} />
    </DashboardShell>
  )
}
