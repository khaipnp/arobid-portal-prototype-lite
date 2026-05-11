import { PartnerExpoList } from "@/components/partner/partner-expo-list"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import {
  listExposByOwner,
  listGoLIVEEvents
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function PartnerExposPage() {
  const userId = await requireRole("partner")
  const [expos, goLiveEvents] = await Promise.all([
    listExposByOwner(userId),
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
