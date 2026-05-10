import { PartnerExpoList } from "@/components/partner/partner-expo-list"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listExpos, listGoLIVEEvents } from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function PartnerExposPage() {
  const [expos, goLiveEvents] = await Promise.all([
    listExpos(),
    listGoLIVEEvents()
  ])

  return (
    <DashboardShell
      title="My Expos"
      description="Manage your expo events, GoLIVE sessions, and exhibitors."
      breadcrumbs={[
        { label: "Dashboard", href: "/partner" },
        { label: "My Expos" }
      ]}
    >
      <PartnerExpoList expos={expos} goLiveEvents={goLiveEvents} />
    </DashboardShell>
  )
}
