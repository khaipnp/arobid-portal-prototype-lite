import { PartnerExpoList } from "@/components/partner/partner-expo-list"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function PartnerExposPage() {
  return (
    <DashboardShell
      title="My Expos"
      description="Manage your expo events, GoLIVE sessions, and exhibitors."
      breadcrumbs={[
        { label: "Dashboard", href: "/partner" },
        { label: "My Expos" },
      ]}
    >
      <PartnerExpoList />
    </DashboardShell>
  )
}
