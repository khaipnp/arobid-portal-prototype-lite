import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { ExpoForm } from "@/components/tradexpo/expo-form"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { listHallTemplates } from "@/lib/tradexpo/db/hall-templates"
import {
  listActiveExpoTenantOptions,
  listExpoCategories,
  listExpoLayoutTemplates
} from "@/lib/tradexpo/db/platform-data"

export const dynamic = "force-dynamic"

export default async function CreateExpoPage() {
  await ensurePlatformSchema()
  const [categories, layoutTemplates, hallTemplates, tenantOptions] =
    await Promise.all([
      listExpoCategories(),
      listExpoLayoutTemplates(),
      listHallTemplates(),
      listActiveExpoTenantOptions()
    ])

  return (
    <DashboardShell
      title="Create Expo"
      description="Set up metadata, schedule, owner, and hall configuration."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "TradeXpo", href: "/admin/tradexpo" },
        { label: "Expo List", href: "/admin/tradexpo/expos" },
        { label: "Create" }
      ]}
      showBackButton
    >
      <ExpoForm
        mode="create"
        categories={categories}
        layoutTemplates={layoutTemplates}
        hallTemplates={hallTemplates}
        tenantOptions={tenantOptions}
      />
    </DashboardShell>
  )
}
