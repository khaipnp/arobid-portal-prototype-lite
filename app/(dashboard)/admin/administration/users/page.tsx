import { AdministrationListPage } from "@/components/administration/administration-list-page"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { getAdministrationList } from "@/lib/administration/list"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  await ensurePlatformSchema()
  const initialData = await getAdministrationList({
    entity: "users",
    pageSize: 20
  })

  return (
    <DashboardShell
      title="Users"
      description="View platform user accounts across Arobid."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Administration" },
        { label: "Users" }
      ]}
    >
      <AdministrationListPage entity="users" initialData={initialData} />
    </DashboardShell>
  )
}
