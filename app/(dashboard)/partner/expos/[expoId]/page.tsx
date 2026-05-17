import { notFound } from "next/navigation"
import { PartnerExpoDetailTabs } from "@/components/partner/partner-expo-detail-tabs"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import {
  getPartnerAssignedExpo,
  getPartnerExpoExhibitors,
  getPartnerExpoOperationsDetail
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import {
  listGoLIVEEvents,
  listStreamSessions
} from "@/lib/tradexpo/db/platform-data"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

export const dynamic = "force-dynamic"

export default async function PartnerExpoDetailPage({
  params
}: {
  params: Promise<{ expoId: string }>
}) {
  const { expoId } = await params
  await ensurePlatformSchema()
  const userId = await requireRole("partner")
  const assignedExpo = await getPartnerAssignedExpo(userId, expoId)
  if (!assignedExpo) notFound()
  const { expo } = assignedExpo

  const [operations, exhibitorsWorkspace, initialGoLIVEEvents, initialStreamSessions] =
    await Promise.all([
      getPartnerExpoOperationsDetail(userId, expoId),
      getPartnerExpoExhibitors(userId, expoId),
      listGoLIVEEvents(),
      listStreamSessions()
    ])

  if (!operations || !exhibitorsWorkspace) notFound()

  return (
    <DashboardShell
      title={expo.name}
      description={`${formatDate(expo.startDate)} - ${formatDate(expo.endDate)}`}
      breadcrumbs={[
        { label: "Overview", href: "/partner" },
        { label: "Expo Programs", href: "/partner/expos" },
        { label: expo.name }
      ]}
      showBackButton
    >
      <div className="px-4">
        <PartnerExpoDetailTabs
          expoId={expoId}
          assignedExpo={assignedExpo}
          operations={operations}
          exhibitorsWorkspace={exhibitorsWorkspace}
          initialGoLIVEEvents={initialGoLIVEEvents}
          initialStreamSessions={initialStreamSessions}
        />
      </div>
    </DashboardShell>
  )
}
