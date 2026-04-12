import Link from "next/link"

import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { TradeXpoOverview } from "@/components/tradexpo/tradexpo-overview"
import { Button } from "@/components/ui/button"

export default function TradeXpoDashboardPage() {
  return (
    <DashboardShell
      title="TradeXpo Module Dashboard"
      description="Manage hall templates, booth templates, and 3D slot configurations in one place."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "TradeXpo" },
      ]}
    >
      <TradeXpoOverview />
    </DashboardShell>
  )
}
