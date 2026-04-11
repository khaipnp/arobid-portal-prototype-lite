import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { ExpoListManager } from "@/components/tradexpo/expo-list-manager"

export default function ExpoListPage() {
  return (
    <DashboardShell
      title="Expo Management"
      description="View, filter, and manage all Expos on the platform."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Expo List" },
      ]}
    >
      <ExpoListManager />
    </DashboardShell>
  )
}
