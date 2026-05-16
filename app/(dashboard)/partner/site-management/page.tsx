import { PartnerSiteManagementManager } from "@/components/partner/partner-site-management-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerSiteManagementPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "site_management")

  return (
    <DashboardShell
      title="Site Management"
      description="Configure the tenant homepage branding, sections, partners, and sponsors in a local preview workspace."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Site Management" }
      ]}
    >
      <PartnerSiteManagementManager access={access} />
    </DashboardShell>
  )
}
