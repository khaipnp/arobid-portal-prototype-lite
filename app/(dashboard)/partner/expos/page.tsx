import { PartnerExpoList } from "@/components/partner/partner-expo-list"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { listPartnerAssignedExpos } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerExposPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const assignedExpos = await listPartnerAssignedExpos(userId)

  return (
    <DashboardShell
      title="My Expos"
      description="Manage your expo events, GoLIVE sessions, and exhibitors."
      breadcrumbs={[
        { label: "Dashboard", href: "/partner" },
        { label: "My Expos" }
      ]}
    >
      <PartnerExpoList assignedExpos={assignedExpos} />
    </DashboardShell>
  )
}
