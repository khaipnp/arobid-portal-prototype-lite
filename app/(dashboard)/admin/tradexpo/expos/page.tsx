import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { ExpoListManager } from "@/components/tradexpo/expo-list-manager"
import { listExpoCategories, listExpos } from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function ExpoListPage() {
  const [initialExpos, initialCategories] = await Promise.all([
    listExpos(),
    listExpoCategories(),
  ])

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
      <ExpoListManager
        initialExpos={initialExpos}
        initialCategories={initialCategories}
      />
    </DashboardShell>
  )
}
