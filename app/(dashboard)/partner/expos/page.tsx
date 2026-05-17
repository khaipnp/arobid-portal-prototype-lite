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
      title="Expo Programs"
      description="View assigned Expo and program scopes granted to your Partner Organization."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo Programs" }
      ]}
    >
      <PartnerExpoPrograms access={access} workspace={workspace} />
    </DashboardShell>
  )
}
