import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdministrationModulesPage() {
  return (
    <DashboardShell
      title="Administration - Modules"
      description="Browse all modules configured in the platform."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Administration", href: "/admin/administration/modules" },
        { label: "Modules" },
      ]}
    >
      <AdministrationListPage entity="modules" />
    </DashboardShell>
  )
}
