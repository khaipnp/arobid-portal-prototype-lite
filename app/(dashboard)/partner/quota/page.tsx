import { PartnerQuotaManager } from "@/components/partner/partner-quota-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerQuotaWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerQuotaPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "quota")
  const workspace = await getPartnerQuotaWorkspace(userId)

  return (
    <DashboardShell
      title="Quota"
      description="Manage booth quota and invite-code allocation."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Quota" }
      ]}
    >
      <PartnerQuotaManager access={access} workspace={workspace} />
    </DashboardShell>
  )
}
