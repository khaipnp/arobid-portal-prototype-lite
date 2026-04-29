import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getAdministrationList } from "@/lib/administration/list"

export default async function AdministrationRolesPage() {
  const initialData = getAdministrationList({ entity: "roles" })
  return (
    <DashboardShell
      title="Administration - Roles"
      description="Review roles and filter by module."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Administration", href: "/admin/administration/modules" },
        { label: "Roles" },
      ]}
    >
      <AdministrationListPage entity="roles" initialData={initialData} />
    </DashboardShell>
  )
}
