import { SellerExpoList } from "@/components/seller/seller-expo-list"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import {
  listExpos,
  listSellerBoothRegistrations
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function SellerMyExposPage() {
  const userId = await requireRole("seller")
  const [initialExpos, initialRegistrations] = await Promise.all([
    listExpos(),
    listSellerBoothRegistrations(userId)
  ])

  return (
    <DashboardShell
      title="My Expos"
      description="All expo events where you have purchased a booth."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "My Expos" }
      ]}
    >
      <SellerExpoList
        initialExpos={initialExpos}
        initialRegistrations={initialRegistrations}
      />
    </DashboardShell>
  )
}
