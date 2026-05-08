import { SellerExpoDetail } from "@/components/seller/seller-expo-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { listBoothTemplates } from "@/lib/tradexpo/db/booth-templates"
import {
  listBoothCustomizations,
  listExpos,
  listGoLIVEEvents,
  listSellerBoothRegistrations,
  listStreamSessions,
} from "@/lib/tradexpo/db/platform-data"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

interface Props {
  params: Promise<{ expoId: string }>
}

export const dynamic = "force-dynamic"

export default async function SellerExpoDetailPage({ params }: Props) {
  const { expoId } = await params

  const [
    expos,
    allRegistrations,
    boothTemplates,
    boothCustomizations,
    goLiveEvents,
    streamSessions,
  ] = await Promise.all([
    listExpos(),
    listSellerBoothRegistrations(CURRENT_USER_ID),
    listBoothTemplates(),
    listBoothCustomizations(),
    listGoLIVEEvents(),
    listStreamSessions(),
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
        { label: expo?.name ?? expoId },
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
      />
    </DashboardShell>
  )
}
