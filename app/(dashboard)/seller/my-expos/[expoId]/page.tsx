import { SellerExpoDetail } from "@/components/seller/seller-expo-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { sql } from "@/lib/db/neon"
import { listBoothTemplates } from "@/lib/tradexpo/db/booth-templates"
import {
  listBoothCustomizations,
  listExpos,
  listGoLIVEEvents,
  listSellerBoothRegistrations,
  listStreamSessions
} from "@/lib/tradexpo/db/platform-data"
import { listCompanyProducts } from "@/lib/tradexpo/db/products"

interface Props {
  params: Promise<{ expoId: string }>
}

export const dynamic = "force-dynamic"

export default async function SellerExpoDetailPage({ params }: Props) {
  const { expoId } = await params
  const userId = await requireRole("seller")

  // Get user's company ID
  const users = (await sql`
    select company_id from users where id = ${userId} limit 1
  `) as { company_id: string | null }[]
  const companyId = users[0]?.company_id

  const [
    expos,
    allRegistrations,
    boothTemplates,
    boothCustomizations,
    goLiveEvents,
    streamSessions,
    companyProducts
  ] = await Promise.all([
    listExpos(),
    listSellerBoothRegistrations(userId),
    listBoothTemplates(),
    listBoothCustomizations(),
    listGoLIVEEvents(),
    listStreamSessions(),
    companyId ? listCompanyProducts(companyId) : Promise.resolve([])
  ])

  const expo = expos.find((e) => e.id === expoId) ?? null
  const registrations = allRegistrations.filter((r) => r.expoId === expoId)

  return (
    <DashboardShell
      title={expo?.name ?? "Expo Detail"}
      description="Manage and configure the booths you purchased in this expo."
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "My Expos", href: "/seller/my-expos" },
        { label: expo?.name ?? expoId }
      ]}
    >
      <SellerExpoDetail
        expoId={expoId}
        expo={expo}
        registrations={registrations}
        boothTemplates={boothTemplates}
        boothCustomizations={boothCustomizations}
        goLiveEvents={goLiveEvents}
        streamSessions={streamSessions}
        companyProducts={companyProducts}
      />
    </DashboardShell>
  )
}
