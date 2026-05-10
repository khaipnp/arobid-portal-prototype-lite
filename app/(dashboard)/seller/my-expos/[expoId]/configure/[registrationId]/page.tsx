import { notFound } from "next/navigation"
import { SellerBoothConfigurator } from "@/components/seller/seller-booth-configurator"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { listBoothTemplates } from "@/lib/tradexpo/db/booth-templates"
import {
  listBoothCustomizations,
  listBoothTemplateCustomizationConfigs,
  listExhibitorCatalogProducts,
  listExpoBoothTemplateAssignments,
  listExpos,
  listSellerBoothRegistrations
} from "@/lib/tradexpo/db/platform-data"

interface Props {
  params: Promise<{ expoId: string; registrationId: string }>
}

export const dynamic = "force-dynamic"

export default async function SellerBoothConfigurePage({ params }: Props) {
  const { expoId, registrationId } = await params
  const userId = await requireRole("seller")

  const [
    expos,
    registrations,
    boothTemplates,
    expoBoothTemplateAssignments,
    boothTemplateCustomizationConfigs,
    boothCustomizations,
    exhibitorCatalogProducts
  ] = await Promise.all([
    listExpos(),
    listSellerBoothRegistrations(userId),
    listBoothTemplates(),
    listExpoBoothTemplateAssignments(),
    listBoothTemplateCustomizationConfigs(),
    listBoothCustomizations(),
    listExhibitorCatalogProducts()
  ])

  const expo = expos.find((e) => e.id === expoId)
  const registration = registrations.find(
    (r) => r.id === registrationId && r.expoId === expoId
  )
  if (!expo || !registration) notFound()

  return (
    <DashboardShell
      title={`Configure Booth ${registration.boothRef}`}
      description="Customise your booth content, branding, and contact details."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "My Expos", href: "/seller/my-expos" },
        { label: expo.name, href: `/seller/my-expos/${expoId}` },
        { label: `Booth ${registration.boothRef}` }
      ]}
    >
      <SellerBoothConfigurator
        expoId={expoId}
        registrationId={registrationId}
        expo={expo}
        registration={registration}
        boothTemplates={boothTemplates}
        expoBoothTemplateAssignments={expoBoothTemplateAssignments}
        boothTemplateCustomizationConfigs={boothTemplateCustomizationConfigs}
        boothCustomizations={boothCustomizations}
        exhibitorCatalogProducts={exhibitorCatalogProducts}
      />
    </DashboardShell>
  )
}
