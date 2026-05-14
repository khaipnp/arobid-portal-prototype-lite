import { PartnerExpoPrograms } from "@/components/partner/partner-expo-programs"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { getPartnerExpoProgramsWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerExposPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const workspace = await getPartnerExpoProgramsWorkspace(userId)

  return (
    <DashboardShell
      title="Expo Programs"
      description="Manage assigned co-host, turnkey, and bulk booking expo programs."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo Programs" }
      ]}
    >
      <PartnerExpoPrograms workspace={workspace} />
    </DashboardShell>
  )
}
