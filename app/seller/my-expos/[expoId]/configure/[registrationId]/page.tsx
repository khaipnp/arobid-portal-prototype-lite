import { SellerBoothConfigurator } from "@/components/seller/seller-booth-configurator"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { mockExpos, mockSellerRegistrations } from "@/lib/tradexpo/mock-data"

interface Props {
  params: Promise<{ expoId: string; registrationId: string }>
}

export default async function SellerBoothConfigurePage({ params }: Props) {
  const { expoId, registrationId } = await params

  const expo = mockExpos.find((e) => e.id === expoId)
  const registration = mockSellerRegistrations.find(
    (r) => r.id === registrationId,
  )

  return (
    <DashboardShell
      title={`Configure Booth ${registration?.boothRef ?? ""}`}
      description="Customise your booth content, branding, and contact details."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "My Expos", href: "/seller/my-expos" },
        { label: expo?.name ?? expoId, href: `/seller/my-expos/${expoId}` },
        { label: `Booth ${registration?.boothRef ?? registrationId}` },
      ]}
    >
      <SellerBoothConfigurator
        expoId={expoId}
        registrationId={registrationId}
      />
    </DashboardShell>
  )
}
