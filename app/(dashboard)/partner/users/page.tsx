import { PartnerUserManagementManager } from "@/components/partner/partner-user-management-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { getPartnerAccess } from "@/lib/partner/access"
import { getPartnerUserManagementWorkspace } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function PartnerUsersPage() {
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const [access, workspace] = await Promise.all([
    getPartnerAccess(userId),
    getPartnerUserManagementWorkspace(userId)
  ])

  return (
    <DashboardShell
      title="User Management"
      description="Invite, role-change, disable, remove, and reactivate users within the current Partner Organization."
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "User Management" }
      ]}
    >
      <PartnerUserManagementManager
        access={access}
        workspace={workspace}
        currentUserId={userId}
      />
    </DashboardShell>
  )
}
