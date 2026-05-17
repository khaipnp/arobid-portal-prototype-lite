import Link from "next/link"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function AdminPartnerDetailPage({
  params
}: {
  params: Promise<{ partnerOrgId: string }>
}) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const { partnerOrgId } = await params

  return (
    <DashboardShell
      title="Partner Organization Detail"
      description="Manage users, roles, capabilities, and assigned scope for this Partner Organization."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Partners", href: "/admin/partners" },
        { label: partnerOrgId }
      ]}
    >
      <div className="space-y-4 rounded-lg border p-6 text-sm">
        <div className="space-y-2">
          <h2 className="font-medium text-base">Control plane</h2>
          <p className="text-muted-foreground">
            Admin APIs for memberships, roles, capabilities, and scope assignment
            are available for this Partner Organization.
          </p>
        </div>
        <Link
          href={`/admin/partners/${partnerOrgId}/mini-site`}
          className="inline-flex rounded-md border px-3 py-2 font-medium underline-offset-4 hover:underline"
        >
          Open mini-site review
        </Link>
      </div>
    </DashboardShell>
  )
}
