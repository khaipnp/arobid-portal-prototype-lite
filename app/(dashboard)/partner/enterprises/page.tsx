import { PartnerEnterpriseManager } from "@/components/partner/partner-enterprise-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerEnterpriseWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerEnterprisesPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "enterprises")
  const workspace = await getPartnerEnterpriseWorkspace(userId)

  return (
    <DashboardShell
      title="Enterprises & Members"
      description="Track partner community activation against the shared Arobid SSOT."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Enterprises & Members" }
      ]}
    >
      <PartnerEnterpriseManager access={access} workspace={workspace} />
    </DashboardShell>
  )
}
