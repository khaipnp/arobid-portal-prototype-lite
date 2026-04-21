import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdministrationPermissionsPage() {
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
      <AdministrationListPage entity="permissions" />
    </DashboardShell>
  )
}
