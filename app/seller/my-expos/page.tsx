import { SellerExpoList } from "@/components/seller/seller-expo-list"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"

export default function SellerMyExposPage() {
  return (
    <DashboardShell
      title="My Expos"
      description="All expo events where you have purchased a booth."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "My Expos" },
      ]}
    >
      <SellerExpoList />
    </DashboardShell>
  )
}
