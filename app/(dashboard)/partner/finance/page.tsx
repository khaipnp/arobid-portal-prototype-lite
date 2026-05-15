import { PartnerFinanceManager } from "@/components/partner/partner-finance-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerFinanceWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerFinancePage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "finance")
  const workspace = await getPartnerFinanceWorkspace(userId)

  return (
    <DashboardShell
      title="Finance & Settlement"
      description="Track platform-controlled payments, partner revenue share, and monthly settlement."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Finance & Settlement" }
      ]}
    >
      <PartnerFinanceManager access={access} workspace={workspace} />
    </DashboardShell>
  )
}
