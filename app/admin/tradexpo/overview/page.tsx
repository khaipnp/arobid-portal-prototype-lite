import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { TradeXpoOverview } from "@/components/tradexpo/tradexpo-overview"

export default function TradeXpoOverviewPage() {
  return (
    <DashboardShell
      title="TradeXpo Overview"
      description="Monitor expo status, act on pending items, and review recent activity."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Overview" },
      ]}
    >
      <TradeXpoOverview />
    </DashboardShell>
  )
}
