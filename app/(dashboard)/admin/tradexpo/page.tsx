import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { TradeXpoOverview } from "@/components/tradexpo/tradexpo-overview"
import { listBoothTemplates } from "@/lib/tradexpo/db/booth-templates"
import {
  listHallTemplateAssets,
  listHallTemplates
} from "@/lib/tradexpo/db/hall-templates"
import {
  listAdminNotifications,
  listExpos
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function TradeXpoDashboardPage() {
  const [assets, hallTemplates, boothTemplates, expos, notifications] =
    await Promise.all([
      listHallTemplateAssets(),
      listHallTemplates(),
      listBoothTemplates(),
      listExpos(),
      listAdminNotifications()
    ])

  return (
    <DashboardShell
      title="TradeXpo Module Dashboard"
      description="Manage hall templates, booth templates, and 3D slot configurations in one place."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "TradeXpo" }
      ]}
    >
      <TradeXpoOverview
        initialAssets={assets}
        initialHallTemplates={hallTemplates}
        initialBoothTemplates={boothTemplates}
        initialExpos={expos}
        initialNotifications={notifications}
      />
    </DashboardShell>
  )
}
