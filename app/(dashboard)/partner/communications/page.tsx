import { PartnerCommunicationsManager } from "@/components/partner/partner-communications-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerCommunicationsWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerCommunicationsPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "communications")
  const workspace = await getPartnerCommunicationsWorkspace(userId)

  return (
    <DashboardShell
      title="Communications"
      description="Context-bound partner messaging for service inquiry, bundle purchase, deal support, and expo participation."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Communications" }
      ]}
    >
      <PartnerCommunicationsManager access={access} workspace={workspace} />
    </DashboardShell>
  )
}
