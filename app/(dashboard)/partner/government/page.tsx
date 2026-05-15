import { PartnerGovernmentProgramManager } from "@/components/partner/partner-government-program-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerGovernmentProgramWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerGovernmentProgramsPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "government")
  const workspace = await getPartnerGovernmentProgramWorkspace(userId)

  return (
    <DashboardShell
      title="Government Programs"
      description="Operate SME support programs with quota, invite campaigns, and TradeCredits."
      breadcrumbs={[{ label: "Government Programs" }]}
    >
      <PartnerGovernmentProgramManager access={access} workspace={workspace} />
    </DashboardShell>
  )
}
