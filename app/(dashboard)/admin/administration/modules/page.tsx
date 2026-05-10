import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getAdministrationList } from "@/lib/administration/list"

export default async function AdministrationModulesPage() {
  const initialData = await getAdministrationList({ entity: "modules" })
  return (
    <DashboardShell
      title="Modules"
      description="Browse all modules configured in the platform."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Administration", href: "/admin/administration/modules" },
        { label: "Modules" }
      ]}
    >
      <AdministrationListPage entity="modules" initialData={initialData} />
    </DashboardShell>
  )
}
