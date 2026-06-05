import { PartnerExpoPrograms } from "@/components/partner/partner-expo-programs"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { requirePartnerTab } from "@/lib/partner/access"
import { getPartnerExpoProgramsWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerExposPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const access = await requirePartnerTab(userId, "expo")
  const workspace = await getPartnerExpoProgramsWorkspace(userId)

  return (
    <DashboardShell
      title="Expo List"
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo List" }
      ]}
    >
      <PartnerExpoPrograms access={access} workspace={workspace} />
    </DashboardShell>
  )
}
