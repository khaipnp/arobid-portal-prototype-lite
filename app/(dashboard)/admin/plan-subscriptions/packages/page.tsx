import { PackageDefinitionManager } from "@/components/plan-subscriptions/package-definition-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getPackageDefinitionWorkspace } from "@/lib/plan-subscriptions/db"

export const dynamic = "force-dynamic"

export default async function AdminPackageDefinitionsPage() {
  const workspace = await getPackageDefinitionWorkspace()

  return (
    <DashboardShell
      title="Plan Packages"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Plan & Subscriptions" },
        { label: "Packages" }
      ]}
    >
      <PackageDefinitionManager initialWorkspace={workspace} />
    </DashboardShell>
  )
}
