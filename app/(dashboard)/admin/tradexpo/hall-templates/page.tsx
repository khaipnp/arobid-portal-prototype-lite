import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { HallTemplateLibraryManager } from "@/components/tradexpo/hall-template-library-manager"
import {
  listHallTemplateAssets,
  listHallTemplates,
  listHallTemplateUsage
} from "@/lib/tradexpo/db/hall-templates"

export const dynamic = "force-dynamic"

export default async function HallTemplateLibraryPage() {
  const [assets, templates, usages] = await Promise.all([
    listHallTemplateAssets(),
    listHallTemplates(),
    listHallTemplateUsage()
  ])

  return (
    <DashboardShell
      title="Hall Template Library"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Hall Templates" }
      ]}
    >
      <HallTemplateLibraryManager
        initialAssets={assets}
        initialTemplates={templates}
        initialUsage={usages}
      />
    </DashboardShell>
  )
}
