import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  getAdministrationList,
  getAdministrationModules,
} from "@/lib/administration/list"

export default async function AdministrationPermissionsPage() {
  const [initialData, moduleOptions] = await Promise.all([
    getAdministrationList({ entity: "permissions" }),
    getAdministrationModules(),
  ])
  return (
    <DashboardShell
      title="Permissions"
      description="Inspect permissions and module-specific assignments."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Administration", href: "/admin/administration/modules" },
        { label: "Permissions" },
      ]}
    >
      <AdministrationListPage
        entity="permissions"
        initialData={initialData}
        moduleOptions={moduleOptions}
      />
    </DashboardShell>
  )
}
