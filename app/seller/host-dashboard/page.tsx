import { HostDashboard } from "@/components/streaming/host-dashboard"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function HostDashboardPage() {
  return (
    <DashboardShell
      title="Host Dashboard"
      description="Manage your assigned GoLIVE sessions. Copy your stream credentials and go live using OBS or any RTMP-compatible software."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "Host Dashboard" },
      ]}
    >
      <HostDashboard />
    </DashboardShell>
  )
}
