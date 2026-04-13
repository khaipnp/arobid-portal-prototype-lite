import { SellerExpoDetail } from "@/components/seller/seller-expo-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { mockExpos } from "@/lib/tradexpo/mock-data"

interface Props {
  params: Promise<{ expoId: string }>
}

export default async function SellerExpoDetailPage({ params }: Props) {
  const { expoId } = await params
  const expo = mockExpos.find((e) => e.id === expoId)

  return (
    <DashboardShell
      title={expo?.name ?? "Expo Detail"}
      description="Manage and configure the booths you purchased in this expo."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "My Expos", href: "/seller/my-expos" },
        { label: expo?.name ?? expoId },
      ]}
    >
      <SellerExpoDetail expoId={expoId} />
    </DashboardShell>
  )
}
