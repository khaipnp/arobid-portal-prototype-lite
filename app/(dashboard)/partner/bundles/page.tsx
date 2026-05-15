import { PartnerBundleManager } from "@/components/partner/partner-bundle-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerBundlesWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerBundlesPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "bundles")
  const workspace = await getPartnerBundlesWorkspace(userId)

  return (
    <DashboardShell
      title="Service Bundles"
      description="Package Alliance partner services with Arobid services and revenue share."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Service Bundles" }
      ]}
    >
      <PartnerBundleManager access={access} workspace={workspace} />
    </DashboardShell>
  )
}
