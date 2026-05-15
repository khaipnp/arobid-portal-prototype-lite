import { notFound } from "next/navigation"
import { PartnerExpoDetailOverview } from "@/components/partner/partner-expo-detail-overview"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { GoLIVEManager } from "@/components/tradexpo/golive-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requireRole } from "@/lib/auth/rbac"
import {
  getPartnerAssignedExpo,
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

  const [operations, initialGoLIVEEvents, initialStreamSessions] =
    await Promise.all([
      getPartnerExpoOperationsDetail(userId, expoId),
      listGoLIVEEvents(),
      listStreamSessions()
    ])

  if (!operations) notFound()

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
      <Tabs defaultValue="overview" className="gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="golive">GoLIVE</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PartnerExpoDetailOverview
            assignedExpo={assignedExpo}
            operations={operations}
          />
        </TabsContent>

        <TabsContent value="golive">
          <GoLIVEManager
            expoId={expoId}
            initialGoLIVEEvents={initialGoLIVEEvents}
            initialStreamSessions={initialStreamSessions}
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
