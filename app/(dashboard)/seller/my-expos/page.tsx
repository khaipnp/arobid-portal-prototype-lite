import { SellerExpoList } from "@/components/seller/seller-expo-list"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import {
  listExpos,
  listSellerBoothRegistrations
} from "@/lib/tradexpo/db/platform-data"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

export const dynamic = "force-dynamic"

export default async function SellerMyExposPage() {
  const [initialExpos, initialRegistrations] = await Promise.all([
    listExpos(),
    listSellerBoothRegistrations(CURRENT_USER_ID)
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
