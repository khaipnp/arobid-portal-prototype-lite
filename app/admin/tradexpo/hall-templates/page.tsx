import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { HallTemplateLibraryManager } from "@/components/tradexpo/hall-template-library-manager"

export default function HallTemplateLibraryPage() {
  return (
    <DashboardShell
      title="Hall Template Library"
      description="Manage hall templates and translations, with publish/deactivate safeguards."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "TradeXpo", href: "/dashboard/tradexpo" },
        { label: "Hall Templates" },
      ]}
    >
      <HallTemplateLibraryManager />
    </DashboardShell>
  )
}
