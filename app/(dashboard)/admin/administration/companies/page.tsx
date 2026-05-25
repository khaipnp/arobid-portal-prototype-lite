import { AdminCompaniesPage } from "@/components/administration/admin-companies-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listAdminCompanies } from "@/lib/administration/companies"
import { requireRole } from "@/lib/auth/rbac"

export const dynamic = "force-dynamic"

export default async function AdminCompaniesRoute() {
  await requireRole("admin")
  const initialData = await listAdminCompanies({ pageSize: 20 })

  return (
    <DashboardShell
      title="Companies"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Administration" },
        { label: "Companies" }
      ]}
    >
      <AdminCompaniesPage initialData={initialData} />
    </DashboardShell>
  )
}
