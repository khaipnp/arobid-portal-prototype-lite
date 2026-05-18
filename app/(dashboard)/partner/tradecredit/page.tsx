import { PartnerTradeCreditReportView } from "@/components/tradecredit/partner-tradecredit-report"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { listPartnerTradeCreditReports } from "@/lib/tradecredit/db"

export const dynamic = "force-dynamic"

export default async function PartnerTradeCreditPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  await requirePartnerTab(userId, "quota")
  const reports = await listPartnerTradeCreditReports(userId)

  return (
    <DashboardShell
      title="TradeCredit Reports"
      description="Read-only aggregate TradeCredit usage across assigned Expo and campaign scope."
      breadcrumbs={[
        { label: "Partner", href: "/partner" },
        { label: "TradeCredit Reports" }
      ]}
    >
      <PartnerTradeCreditReportView reports={reports} />
    </DashboardShell>
  )
}
