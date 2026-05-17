import { notFound } from "next/navigation"
import { PackageDefinitionDetailManager } from "@/components/plan-subscriptions/package-definition-detail-manager"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getPackageDefinitionDetailWorkspace } from "@/lib/plan-subscriptions/db"

export const dynamic = "force-dynamic"

export default async function AdminPackageDefinitionDetailPage({
  params
}: {
  params: Promise<{ packageId: string }>
}) {
  const { packageId } = await params
  const workspace = await getPackageDefinitionDetailWorkspace(packageId)

  if (!workspace) notFound()

  return (
    <DashboardShell
      title={workspace.package.name}
      description="Inspect package commercial details, included plans, validity rules, and warnings."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Plan & Subscriptions" },
        { label: "Packages", href: "/admin/plan-subscriptions/packages" },
        { label: workspace.package.name }
      ]}
      showBackButton
    >
      <PackageDefinitionDetailManager initialWorkspace={workspace} />
    </DashboardShell>
  )
}
