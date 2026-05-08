import { BoothTemplateLibraryManager } from "@/components/tradexpo/booth-template-library-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  listBoothTemplates,
  listBoothTemplateUsage,
  listBoothTypes,
} from "@/lib/tradexpo/db/booth-templates"
import { listHallTemplateAssets } from "@/lib/tradexpo/db/hall-templates"

export const dynamic = "force-dynamic"

export default async function BoothTemplateLibraryPage() {
  const [assets, templates, usages, boothTypes] = await Promise.all([
    listHallTemplateAssets(),
    listBoothTemplates(),
    listBoothTemplateUsage(),
    listBoothTypes(),
  ])

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
      <BoothTemplateLibraryManager
        initialAssets={assets}
        initialTemplates={templates}
        initialUsage={usages}
        initialBoothTypes={boothTypes}
      />
    </DashboardShell>
  )
}
