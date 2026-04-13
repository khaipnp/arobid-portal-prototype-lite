import { BoothTemplateLibraryManager } from "@/components/tradexpo/booth-template-library-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function BoothTemplateLibraryPage() {
  return (
    <DashboardShell
      title="Booth Template Library"
      description="Manage booth templates by booth type"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Booth Templates" },
      ]}
    >
      <BoothTemplateLibraryManager />
    </DashboardShell>
  )
}
