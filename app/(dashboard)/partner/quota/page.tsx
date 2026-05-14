import { PartnerQuotaManager } from "@/components/partner/partner-quota-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { getPartnerQuotaWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerQuotaPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const workspace = await getPartnerQuotaWorkspace(userId)

  return (
    <DashboardShell
      title="Quota & TradeCredits"
      description="Manage booth quota, invite-code allocation, and TradeCredit wallet usage."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Quota & TradeCredits" }
      ]}
    >
      <PartnerQuotaManager workspace={workspace} />
    </DashboardShell>
  )
}
