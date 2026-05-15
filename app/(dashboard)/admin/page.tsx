import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      title="Admin Dashboard"
      description="Access module workspaces and manage feature libraries for TradeXpo."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div />
    </DashboardShell>
  )
}
