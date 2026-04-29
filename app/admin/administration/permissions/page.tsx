import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getAdministrationList } from "@/lib/administration/list"

export default async function AdministrationPermissionsPage() {
  const initialData = getAdministrationList({ entity: "permissions" })
  return (
    <DashboardShell
      title="Administration - Permissions"
      description="Inspect permissions with grouping by role and feature."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Administration", href: "/admin/administration/modules" },
        { label: "Permissions" },
      ]}
    >
      <AdministrationListPage entity="permissions" initialData={initialData} />
    </DashboardShell>
  )
}
