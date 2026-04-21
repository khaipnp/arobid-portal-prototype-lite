import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdministrationRolesPage() {
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
      <AdministrationListPage entity="roles" />
    </DashboardShell>
  )
}
