import { HostDashboard } from "@/components/streaming/host-dashboard"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdminStreamingPage() {
  return (
    <DashboardShell
      title="Host Dashboard"
      description="Manage your assigned GoLIVE sessions. Copy stream credentials and go live using OBS or any RTMP-compatible software."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Streaming" },
      ]}
    >
      <HostDashboard />
    </DashboardShell>
  )
}
