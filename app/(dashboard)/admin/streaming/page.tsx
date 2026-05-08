import { HostDashboard } from "@/components/streaming/host-dashboard"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  listGoLIVEEvents,
  listStreamSessions,
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function AdminStreamingPage() {
  const [initialStreamSessions, initialGoLIVEEvents] = await Promise.all([
    listStreamSessions(),
    listGoLIVEEvents(),
  ])

  return (
    <DashboardShell
      title="Host Dashboard"
      description="Manage your assigned GoLIVE sessions. Copy stream credentials and go live using OBS or any RTMP-compatible software."
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Streaming" }]}
    >
      <HostDashboard
        initialStreamSessions={initialStreamSessions}
        initialGoLIVEEvents={initialGoLIVEEvents}
      />
    </DashboardShell>
  )
}
