import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  getAdministrationList,
  getAdministrationModules,
} from "@/lib/administration/list"

export default async function AdministrationFeaturesPage() {
  const [initialData, moduleOptions] = await Promise.all([
    getAdministrationList({ entity: "features" }),
    getAdministrationModules(),
  ])
  return (
    <DashboardShell
      title="Administration - Features"
      description="Browse features and module-specific assignments."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Administration", href: "/admin/administration/modules" },
        { label: "Features" },
      ]}
    >
      <AdministrationListPage
        entity="features"
        initialData={initialData}
        moduleOptions={moduleOptions}
      />
    </DashboardShell>
  )
}
