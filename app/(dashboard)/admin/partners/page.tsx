import { PartnerOrganizationAdmin } from "@/components/admin/partner/partner-organization-admin"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { listPartnerOrganizationsForAdmin } from "@/lib/partner/admin"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

type PartnerOrganizationAdminRow = {
  id: string
  name: string
  model: string
  partner_type: string
  status: string
  member_count: number
}

export default async function AdminPartnersPage() {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const organizations =
    (await listPartnerOrganizationsForAdmin()) as PartnerOrganizationAdminRow[]

  return (
    <DashboardShell
      title="Partner Organizations"
      description="Create and govern Partner Portal organizations, memberships, capabilities, and scopes."
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Partners" }]}
    >
      <PartnerOrganizationAdmin organizations={organizations} />
    </DashboardShell>
  )
}
