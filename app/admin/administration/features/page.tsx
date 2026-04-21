import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdministrationFeaturesPage() {
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
      <AdministrationListPage entity="features" />
    </DashboardShell>
  )
}
