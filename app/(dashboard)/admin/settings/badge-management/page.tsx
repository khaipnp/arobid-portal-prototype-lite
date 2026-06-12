import { BadgeManagementConfig } from "@/components/badges/badge-management-config"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getBadgeManagementWorkspace } from "@/lib/badges/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export default async function AdminBadgeManagementPage() {
  await ensurePlatformSchema()
  const workspace = await getBadgeManagementWorkspace()

  return (
    <DashboardShell
      title="Badge Management"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Settings" },
        { label: "Badge Management" }
      ]}
    >
      <BadgeManagementConfig initialWorkspace={workspace} />
    </DashboardShell>
  )
}
